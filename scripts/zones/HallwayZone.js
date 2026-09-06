import { Partition } from "../bsp/Partition.js";
import { Zone } from "../generation/Zone.js";

export class HallwayZone extends Zone {
	static id = "hallway_zone";

	constructor(dimensionContext, region, parentZone) {
		super(dimensionContext, region, parentZone);
	}

	/**
	 * Determines if a given partition can be subdivided by this zone.
	 * @param {Partition} partition
	 * @returns {boolean}
	 */
	canSubdivide(partition) {
		return false;
	}
}
