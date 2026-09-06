import { Block, BlockVolume } from "@minecraft/server";

export class Region {
	constructor(origin, size) {
		/**@type {Vector3} */
		this.origin = origin;

		/**@type {Vector3} */
		this.size = size;

		/**@type {Vector3} */
		this.min = origin;

		/**@type {Vector3} */
		this.max = this._calculateMax();
	}

	/**
	 * Creates a Region instance from a BlockVolume.
	 * @param {BlockVolume} volume
	 * @returns {Region}
	 */
	static fromVolume(volume) {
		const origin = volume.getMin();
		const size = volume.getSpan();

		return new Region(origin, size);
	}

	/**
	 * Determines if this Region intersects with another Region.
	 * @param {Region|BlockVolume} regionOrVolume
	 * @returns
	 */
	intersects(regionOrVolume) {
		const otherRegion = regionOrVolume instanceof Region ? regionOrVolume : Region.fromVolume(regionOrVolume);

		const xOverlap = this.min.x <= otherRegion.max.x && this.max.x >= otherRegion.min.x;
		const yOverlap = this.min.y <= otherRegion.max.y && this.max.y >= otherRegion.min.y;
		const zOverlap = this.min.z <= otherRegion.max.z && this.max.z >= otherRegion.min.z;

		return xOverlap && zOverlap;
	}

	/**
	 * Converts the Region instance to a BlockVolume.
	 * @returns {BlockVolume}
	 */
	toVolume() {
		return new BlockVolume(this.min, this.max);
	}

	/**
	 * Returns a string representation of the Region instance.
	 * @returns {string}
	 */
	toString() {
		return `Region(origin: { x: ${this.origin.x}, y: ${this.origin.y}, z: ${this.origin.z} }, size: { x: ${this.size.x}, y: ${this.size.y}, z: ${this.size.z} })`;
	}

	identity() {
		return `${this.origin.x},${this.origin.y},${this.origin.z}:${this.size.x},${this.size.y},${this.size.z}`;
	}

	_calculateMax() {
		return {
			x: this.origin.x + this.size.x - 1,
			y: this.origin.y + this.size.y - 1,
			z: this.origin.z + this.size.z - 1
		};
	}
}
