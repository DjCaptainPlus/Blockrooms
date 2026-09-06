import { blockRooms } from "../main.js";

export class CellPosition {
	/**
	 * Creates a new CellPosition instance.
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	constructor(x, y, z) {
		/**@type {number} */
		this.x = x;

		/**@type {number} */
		this.y = y;

		/**@type {number} */
		this.z = z;

		/**@type {string} */
		this.key = `${this.x},${this.y},${this.z}`;
	}

	/**
	 * Gets the cell position from a world position.
	 * @param {Vector3} worldPosition
	 * @returns {CellPosition}
	 */
	static fromWorldPosition(worldPosition) {
		const cellX = Math.floor(worldPosition.x / blockRooms.CELL_SIZE);
		const cellY = Math.floor(worldPosition.y / blockRooms.CELL_SIZE);
		const cellZ = Math.floor(worldPosition.z / blockRooms.CELL_SIZE);

		return new CellPosition(cellX, cellY, cellZ);
	}

	/**
	 * Returns a string representation of the cell position in the format "x,y,z".
	 * @returns {string}
	 */
	toString() {
		return this.key;
	}
}
