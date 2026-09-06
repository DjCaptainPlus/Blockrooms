import { Region } from "../classes/Region.js";

/** @typedef {import("@minecraft/server").BlockVolume} BlockVolume */
/** @typedef {import("../classes/DimensionContext.js").DimensionContext} DimensionContext */
/** @typedef {import("../generation/Zone.js").Zone} Zone */

export class Partition {
	/**
	 * @param {Zone} zone
	 * @param {Region} region
	 * @param {Partition} [parentPartition]
	 */
	constructor(zone, region, parentPartition = undefined) {
		if (parentPartition && parentPartition.zone !== zone) {
			throw new Error("A parent partition must belong to the same zone.");
		}

		/** @type {Zone} */
		this.zone = zone;

		/** @type {Region} */
		this.region = region;

		/** @type {Partition | undefined} */
		this.parentPartition = parentPartition;

		/** @type {number} */
		this.depth = parentPartition ? parentPartition.depth + 1 : 0;
	}

	/** @returns {DimensionContext} */
	get dimensionContext() {
		return this.zone.dimensionContext;
	}

	/** @returns {Vector3} */
	get origin() {
		return this.region.origin;
	}

	/** @returns {Vector3} */
	get size() {
		return this.region.size;
	}

	/** @returns {Vector3} */
	get min() {
		return this.region.min;
	}

	/** @returns {Vector3} */
	get max() {
		return this.region.max;
	}

	/**
	 * Determines if this partition intersects with another region or block volume.
	 * @param {Region | BlockVolume} regionOrVolume
	 * @returns {boolean}
	 */
	intersects(regionOrVolume) {
		return this.region.intersects(regionOrVolume);
	}

	/** @returns {string} */
	toString() {
		const dimensionId = this.dimensionContext.dimension.id;

		return `Partition(dimension: ${dimensionId}, zone: ${this.zone.id}, origin: { x: ${this.origin.x}, y: ${this.origin.y}, z: ${this.origin.z} }, size: { x: ${this.size.x}, y: ${this.size.y}, z: ${this.size.z} })`;
	}

	/** @returns {string} */
	identity() {
		return `${this.dimensionContext.id}:${this.origin.x},${this.origin.y},${this.origin.z}:${this.size.x},${this.size.y},${this.size.z}`;
	}
}
