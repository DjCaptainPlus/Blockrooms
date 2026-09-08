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

	/**
	 * Splits the Region into multiple smaller Regions along the specified axis at the given offsets.
	 * @param {"x"|"z"} axis
	 * @param {number[]} offsets
	 */
	split(axis, ...offsets) {
		try {
			this._validateAxis(axis);
			this._validateOffsets(axis, offsets);

			offsets.sort((a, b) => a - b);

			const regions = [];

			let previousOffset = 0;
			for (const offset of offsets) {
				const origin = { ...this.min };
				const size = { ...this.size };

				origin[axis] = this.min[axis] + previousOffset;
				size[axis] = offset - previousOffset;

				const newRegion = new Region(origin, size);
				regions.push(newRegion);

				previousOffset = offset;
			}

			const remainderOrigin = { ...this.min };
			const remainderSize = { ...this.size };
			remainderOrigin[axis] = this.min[axis] + previousOffset;
			remainderSize[axis] = this.size[axis] - previousOffset;

			const remainderRegion = new Region(remainderOrigin, remainderSize);
			regions.push(remainderRegion);

			return regions;
		} catch (error) {
			throw new Error(`Failed to split region: ${error.message}`);
		}
	}

	slice() {}

	expand(amount) {}

	inset(amount) {}

	_calculateMax() {
		return {
			x: this.origin.x + this.size.x - 1,
			y: this.origin.y + this.size.y - 1,
			z: this.origin.z + this.size.z - 1
		};
	}

	/**
	 * Validates the axis for splitting the region.
	 * @param {"x"|"z"} axis
	 */
	_validateAxis(axis) {
		if (axis !== "x" && axis !== "z") {
			throw new Error(`Invalid axis: ${axis}. Must be "x" or "z".`);
		}
	}

	/**
	 * Validates the offsets for splitting the region.
	 * @param {"x"|"z"} axis
	 * @param {number[]} offsets
	 */
	_validateOffsets(axis, offsets) {
		const rangeMin = 1;
		const rangeMax = this.size[axis] - 1;

		for (let i = 0; i < offsets.length; i++) {
			const offset = offsets[i];

			if (!Number.isInteger(offset)) {
				throw new TypeError(`Offset at index ${i} (${offset}) is not an integer.`);
			}

			if (offset < rangeMin || offset > rangeMax) {
				throw new RangeError(`Offset at index ${i} (${offset}) is out of range. Must be between ${rangeMin} and ${rangeMax}.`);
			}
		}

		if (new Set(offsets).size !== offsets.length) {
			throw new Error(`Offsets must be unique.`);
		}
	}
}
