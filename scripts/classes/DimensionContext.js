import { world } from "@minecraft/server";
import { CellRegistry } from "../cell/CellRegistry.js";

/** @typedef {import("@minecraft/server").Dimension} Dimension */

export class DimensionContext {
	/**
	 * @param {string} id
	 * @param {() => Generator} generator
	 */
	constructor(id, generator) {
		/**@type {string} */
		this.id = id;

		/**@type {} */
		this.generator = generator;

		/**@type {Dimension} */
		this.dimension = world.getDimension(this.id);

		/**@type {CellRegistry} */
		this.registry = new CellRegistry(this.dimension);
	}
}
