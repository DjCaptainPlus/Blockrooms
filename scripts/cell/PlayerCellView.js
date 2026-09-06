import { blockRooms } from "../main.js";
import { CellPosition } from "./CellPosition.js";
import { CellViewZone } from "../types/CellViewZone.js";
import { CellTransitionState } from "../types/CellTransitionState.js";
import { DimensionContext } from "../classes/DimensionContext.js";
import { CellInterest } from "../types/CellInterest.js";
import { world } from "@minecraft/server";

/** @typedef {import("@minecraft/server").Dimension} Dimension */
/** @typedef {import("@minecraft/server").Player} Player */
/** @typedef {import("./Cell.js").Cell} Cell */
/** @typedef {import("./CellRegistry.js").CellRegistry} CellRegistry */

export class PlayerCellView {
	/**
	 *
	 * @param {Player} player
	 * @param {DimensionContext} dimensionContext
	 */
	constructor(player, dimensionContext) {
		/**@type {DimensionContext} */
		this.context = dimensionContext;

		/**@type {Dimension} */
		this.dimension = dimensionContext.dimension;

		/**@type {CellRegistry} */
		this.registry = dimensionContext.registry;

		/**@type {Player} */
		this.player = player;

		/**@type {Map<string, Cell>} */
		this.active = new Map();

		/**@type {Map<string, Cell>} */
		this.retained = new Map();

		/**@type {number} */
		this.viewRadius = blockRooms.CELL_VIEW_RADIUS + blockRooms.CELL_RETENTION_MARGIN;

		/**@type {number} */
		this.activeRadius = blockRooms.CELL_VIEW_RADIUS;

		/**@type {number} */
		this.verticalRange = blockRooms.CELL_VIEW_VERTICAL_RANGE;
	}

	// ************
	// ** Public **
	// ************

	get playerCell() {
		return this.registry.getCell(this.player.location);
	}

	get interestedCount() {
		return this.active.size + this.retained.size;
	}

	get activeCount() {
		return this.active.size;
	}

	get retainedCount() {
		return this.retained.size;
	}

	/**
	 * Determines the interest level of a cell for this player.
	 * @param {Cell} cell
	 * @returns {number} 0 for not interested, 1 for retained, 2 for interested
	 */
	getInterestLevel(cell) {
		const key = cell.position.key;

		if (this.active.has(key)) {
			return CellInterest.INTERESTED;
		} else if (this.retained.has(key)) {
			return CellInterest.RETAINED;
		} else {
			return CellInterest.NOT_INTERESTED;
		}
	}

	/**
	 * Checks if the player is interested in the given cell.
	 * @param {Cell} cell
	 * @returns {boolean} True if the player is interested in the cell, false otherwise.
	 */
	isInterested(cell) {
		return this.getInterestLevel(cell) !== CellInterest.NOT_INTERESTED;
	}

	update() {
		const centerPosition = this.playerCell.position;
		const updatedViewPositions = this._getCellPositionsInView(centerPosition);

		const releasedCells = [];
		const { newActive, newRetained, acquiredCells } = this._sortCells(updatedViewPositions, centerPosition);

		if (this.player) {
			acquiredCells.sort((a, b) => {
				const distanceA = Math.abs(a.min.x + 8 - this.player.location.x) + Math.abs(a.min.y + 8 - this.player.location.y) + Math.abs(a.min.z + 8 - this.player.location.z);

				const distanceB = Math.abs(b.min.x + 8 - this.player.location.x) + Math.abs(b.min.y + 8 - this.player.location.y) + Math.abs(b.min.z + 8 - this.player.location.z);

				return distanceB - distanceA;
			});
		}

		blockRooms.dispatcher.request(this.player, ...acquiredCells);

		for (const [key, cell] of [...this.active, ...this.retained]) {
			if (!newActive.has(key) && !newRetained.has(key)) {
				const interestLevel = this.getInterestLevel(cell);

				if (interestLevel === CellInterest.INTERESTED) {
					cell.activeInterestCount--;
				} else if (interestLevel === CellInterest.RETAINED) {
					cell.retainedInterestCount--;
				}

				releasedCells.push(cell);
			}
		}

		blockRooms.dispatcher.tryDelete(...releasedCells);

		this.active = newActive;
		this.retained = newRetained;
	}

	cleanup() {
		// Eventually release all cells.
	}

	// **************
	// ** Internal **
	// **************

	/**
	 * Calculates all cell positions within the view radius from the center cell position.
	 * @param {CellPosition} centerCellPosition
	 * @returns
	 */
	_getCellPositionsInView(centerCellPosition) {
		const cellPositionsInView = [];

		for (let x = -this.viewRadius; x <= this.viewRadius; x++) {
			for (let y = -this.verticalRange; y <= this.verticalRange; y++) {
				const remainingDistance = this.viewRadius - Math.abs(x);

				for (let z = -remainingDistance; z <= remainingDistance; z++) {
					const cellPosition = new CellPosition(centerCellPosition.x + x, centerCellPosition.y + y, centerCellPosition.z + z);
					cellPositionsInView.push(cellPosition);
				}
			}
		}

		return cellPositionsInView;
	}

	/**
	 * Sorts cells into new active and retained maps based on their transition states.
	 * @param {CellPosition[]} cellPositions
	 * @param {CellPosition} centerCellPosition
	 * @returns {{newActive: Map<string, Cell>, newRetained: Map<string, Cell>, acquiredCells: Cell[]}}
	 */
	_sortCells(cellPositions, centerCellPosition) {
		const newActive = new Map();
		const newRetained = new Map();
		const acquiredCells = [];

		for (const cellPosition of cellPositions) {
			const cellKey = cellPosition.key;
			const zone = this._getCellZone(cellPosition, centerCellPosition);
			const transitionState = this._determineCellTransitionState(cellPosition, zone);

			if (transitionState === CellTransitionState.INACTIVE_TO_RETAINED) {
				continue;
			}

			const cell = this.registry.getCell(cellPosition);

			switch (transitionState) {
				case CellTransitionState.STILL_ACTIVE: {
					newActive.set(cellKey, cell);
					continue;
				}
				case CellTransitionState.STILL_RETAINED: {
					newRetained.set(cellKey, cell);
					continue;
				}
				case CellTransitionState.ACTIVE_TO_RETAINED: {
					cell.activeInterestCount--;
					cell.retainedInterestCount++;
					newRetained.set(cellKey, cell);
					continue;
				}
				case CellTransitionState.RETAINED_TO_ACTIVE: {
					cell.retainedInterestCount--;
					cell.activeInterestCount++;
					newActive.set(cellKey, cell);
					acquiredCells.push(cell);
					continue;
				}
				case CellTransitionState.INACTIVE_TO_ACTIVE: {
					cell.activeInterestCount++;
					newActive.set(cellKey, cell);
					acquiredCells.push(cell);
					continue;
				}
			}
		}

		return { newActive, newRetained, acquiredCells };
	}

	/**
	 * Determines the zone of a cell relative to the center position.
	 * @param {CellPosition} cellPosition
	 * @param {CellPosition} centerPosition
	 * @returns {number}
	 */
	_getCellZone(cellPosition, centerPosition) {
		const xDistance = Math.abs(cellPosition.x - centerPosition.x);
		const zDistance = Math.abs(cellPosition.z - centerPosition.z);

		const horizontalDifference = xDistance + zDistance;

		if (horizontalDifference <= this.activeRadius) {
			return CellViewZone.Active;
		}

		return CellViewZone.Retention;
	}

	/**
	 * Determines the transition state of a cell based on its previous state and the current zone.
	 * @param {CellPosition} cellPosition
	 * @param {number} zone
	 * @returns {number}
	 */
	_determineCellTransitionState(cellPosition, zone) {
		const cellKey = cellPosition.key;

		const cellWasActive = this.active.has(cellKey);
		const cellWasRetained = this.retained.has(cellKey);
		const cellWasInactive = cellWasActive === false && cellWasRetained === false;

		const zoneIsActive = zone === CellViewZone.Active;
		const zoneIsRetention = zone === CellViewZone.Retention;

		if (cellWasActive && zoneIsActive) {
			return CellTransitionState.STILL_ACTIVE;
		} else if (cellWasActive && zoneIsRetention) {
			return CellTransitionState.ACTIVE_TO_RETAINED;
		} else if (cellWasRetained && zoneIsActive) {
			return CellTransitionState.RETAINED_TO_ACTIVE;
		} else if (cellWasRetained && zoneIsRetention) {
			return CellTransitionState.STILL_RETAINED;
		} else if (cellWasInactive && zoneIsActive) {
			return CellTransitionState.INACTIVE_TO_ACTIVE;
		} else if (cellWasInactive && zoneIsRetention) {
			return CellTransitionState.INACTIVE_TO_RETAINED;
		}
	}
}
