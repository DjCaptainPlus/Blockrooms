import { CellPosition } from "./CellPosition.js";
import { blockRooms } from "../main.js";
import { CellState } from "../types/CellState.js";

/** @typedef {import("@minecraft/server").Dimension} Dimension */
/** @typedef {import("./CellRegistry.js").CellRegistry} CellRegistry */

export class Cell {
	/**
	 * Creates a new Cell instance.
	 * @param {CellRegistry} registry
	 * @param {CellPosition} position
	 */
	constructor(registry, position) {
		if (!(position instanceof CellPosition)) {
			throw new Error("Position must be an instance of CellPosition");
		}

		/**@type {CellRegistry} */
		this.registry = registry;

		/**@type {Dimension} */
		this.dimension = registry.dimension;

		/**@type {CellPosition} */
		this.position = position;

		/**@type {number} */
		this.state = CellState.Idle;

		/**@type {number} */
		this.size = blockRooms.CELL_SIZE;

		/**@type {number} */
		this.activeInterestCount = 0;

		/**@type {number} */
		this.retainedInterestCount = 0;
	}

	/**
	 * Calculates the minimum corner of the cell in world coordinates.
	 * @type {DimensionLocation}
	 */
	get min() {
		return {
			x: this.position.x * this.size,
			y: this.position.y * this.size,
			z: this.position.z * this.size,
			dimension: this.dimension
		};
	}

	/**
	 * Calculates the maximum corner of the cell in world coordinates.
	 * @type {DimensionLocation}
	 */
	get max() {
		return {
			x: this.position.x * this.size + this.size - 1,
			y: this.position.y * this.size + this.size - 1,
			z: this.position.z * this.size + this.size - 1,
			dimension: this.dimension
		};
	}

	get interestCount() {
		return this.activeInterestCount + this.retainedInterestCount;
	}

	get hasActiveInterest() {
		return this.activeInterestCount > 0;
	}

	get hasRetainedInterest() {
		return this.retainedInterestCount > 0;
	}

	/**
	 * Checks if the cell is currently loaded in the dimension.
	 * @type {boolean}
	 */
	get isLoaded() {
		return this.dimension.isChunkLoaded(this.min);
	}

	/**
	 * Deletes the cell from the registry.
	 * @returns {boolean} Returns true if the cell was deleted, false if it was not found.
	 */
	delete() {
		return this.registry.delete(this);
	}

	/**
	 * Sets the state of the cell.
	 * @param {number} state
	 */
	setState(state) {
		if (!Object.values(CellState).includes(state)) {
			throw new Error(`Invalid cell state: ${state}`);
		}

		this.state = state;
	}
}
