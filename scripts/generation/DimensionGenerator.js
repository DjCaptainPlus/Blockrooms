import { BlockVolume, world } from "@minecraft/server";
import { blockRooms } from "../main.js";
import { Zone } from "./Zone.js";
import { DimensionContext } from "../classes/DimensionContext.js";
import { Random } from "../math/Random.js";
import { RandomFactory } from "../math/RandomFactory.js";
import { Region } from "../classes/Region.js";

export class DimensionGenerator {
	/**
	 *
	 * @param {Object} config
	 * @param {Vector3} [config.origin]
	 * @param {typeof Zone} config.rootZone
	 * @param {DimensionContext} config.dimensionContext
	 */
	constructor({ size = blockRooms.DEFAULT_DIMENSION_SIZE, rootZone, dimensionContext } = {}) {
		/**@type {RandomFactory} */
		this.randomFactory = new RandomFactory(Random.hashString(world.seed));

		/**@type {Region} */
		this.rootRegion = this._calculateZoneRegion(size);

		/**@type {Zone} */
		this.rootZone = new rootZone(dimensionContext, this.rootRegion);
	}

	/**
	 * Calculates the origin of the zone based on its size.
	 * @param {Vector3} size
	 * @returns {Region}
	 */
	_calculateZoneRegion(size) {
		const origin = {
			x: -Math.floor(size.x / 2),
			y: 0,
			z: -Math.floor(size.z / 2)
		};

		return new Region(origin, size);
	}

	/**
	 * Generates the final partitions intersecting the given volume.
	 * @param {BlockVolume} volume
	 * @returns {Partition[]}
	 */
	getPartitions(volume) {
		const finalPartitions = [];
		const stack = [this.rootZone.rootPartition];

		while (stack.length > 0) {
			const partition = stack.pop();

			if (!partition.intersects(volume)) {
				continue;
			}

			const childPartitions = partition.zone.expandPartition(partition);

			if (childPartitions === undefined) {
				finalPartitions.push(partition);
				continue;
			}

			for (const child of childPartitions) {
				stack.push(child);
			}
		}

		return finalPartitions;
	}
}
