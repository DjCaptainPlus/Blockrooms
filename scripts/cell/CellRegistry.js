import { CellPosition } from "./CellPosition.js";
import { Cell } from "./Cell.js";

/** @typedef {import("@minecraft/server").Dimension} Dimension */

export class CellRegistry {
	/**
	 * Creates a new CellRegistry instance.
	 * @param {Dimension} dimension
	 */
	constructor(dimension) {
		/**@type {Dimension} */
		this.dimension = dimension;

		/**@type {Map<string, Cell>} */
		this.cellMap = new Map();
	}

	/**
	 * Gets a cell at the given position.
	 * @param {Vector3|CellPosition} position
	 * @returns {Cell}
	 */
	getCell(position) {
		const cellPosition = position instanceof CellPosition ? position : CellPosition.fromWorldPosition(position);
		const cellKey = cellPosition.key;

		if (!this.cellMap.has(cellKey)) {
			this.cellMap.set(cellKey, new Cell(this, cellPosition));
		}

		const cell = this.cellMap.get(cellKey);

		return cell;
	}

	/**
	 * Deletes a cell from the registry.
	 * @param {Cell} cell
	 * @returns {boolean} Returns true if the cell was deleted, false if it was not found.
	 */
	delete(cell) {
		const cellKey = cell.position.key;

		if (this.cellMap.has(cellKey)) {
			this.cellMap.delete(cellKey);
			return true;
		}

		return false;
	}
}
