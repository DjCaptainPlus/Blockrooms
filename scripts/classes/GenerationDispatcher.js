import { Player, system } from "@minecraft/server";
import { Cell } from "../cell/Cell.js";
import { blockRooms } from "../main.js";
import { CellState } from "../types/CellState.js";

export class GenerationDispatcher {
	constructor() {
		/**@type {Map<string, Cell[]>} */
		this.generators = new Map();
	}

	// ************
	// ** Public **
	// ************

	/**
	 * Adds cells to the request queue and starts the request loop if it's not already running.
	 * @param {Player} player
	 * @param  {...Cell} cells
	 */
	request(player, ...cells) {
		const cellsToGenerate = [];

		for (const cell of cells) {
			if (cell.state !== CellState.Idle) continue;
			if (this._cellIsFinished(cell)) {
				cell.setState(CellState.Finished);
				continue;
			}

			cell.setState(CellState.Pending);
			cellsToGenerate.push(cell);
		}

		if (cellsToGenerate.length === 0) {
			return;
		}

		if (!this.generators.has(player.id)) {
			this.generators.set(player.id, [...cellsToGenerate]);

			system.runJob(this._runGeneration(this.generators.get(player.id), player));
		} else {
			this.generators.get(player.id).push(...cellsToGenerate);
		}
	}

	/**
	 *
	 * @param  {...Cell} cells
	 */
	tryDelete(...cells) {
		for (const cell of cells) {
			const isIdle = cell.state === CellState.Idle;
			const isPending = cell.state === CellState.Pending;

			const hasAnyInterest = cell.hasActiveInterest || cell.hasRetainedInterest;
			const hasActiveInterest = cell.hasActiveInterest;

			if (hasActiveInterest) continue;

			if (isIdle && !hasAnyInterest) {
				cell.delete();
				continue;
			}

			if (isPending && !hasAnyInterest) {
				cell.delete();
				continue;
			}
		}
	}

	// **************
	// ** Internal **
	// **************

	/**
	 * Determines if a cell is finished based on its minimum corner block type.
	 * @param {Cell} cell
	 */
	_cellIsFinished(cell) {
		// Logic here gonna change I'm sure.

		const blockAtMin = cell.dimension.getBlock(cell.min);

		if (!blockAtMin) return false; // TEMP

		return blockAtMin.typeId === "minecraft:bedrock";
	}

	/**
	 * 
	 * @param {Cell[]} cells 
	 * @param {Player} player 
	 */
	*_runGeneration(cells, player) {
		const dimensionContext = blockRooms.dimensionContexts.get(player.dimension);
		const generator = dimensionContext.generator;

		try {
			while (cells.length > 0) {
				const cell = cells.pop();

				if (!cell.hasActiveInterest && !cell.hasRetainedInterest) {
					cell.delete();
					continue;
				}	

				if (!cell.isLoaded || !cell.hasActiveInterest) {
					cell.setState(CellState.Idle);
					continue;
				}

				cell.setState(CellState.Working);
				yield* generator(cell, player, dimensionContext);
				cell.setState(CellState.Finished);
			}
		} finally {
			this.generators.delete(player.id);
		}
	}
}
