import { Partition } from "../bsp/Partition.js";
import { Region } from "../classes/Region.js";
import { Zone } from "../generation/Zone.js";
import { ZoneTypes } from "./ZoneTypes.js";

export class HallwayZone extends Zone {
	static id = "hallway_zone";

	static subzoneRules = {
		selectionDepth: 0
	};

	constructor(dimensionContext, region, parentZone) {
		super(dimensionContext, region, parentZone);
	}

	/**
	 * Expands a partition into children, or returns undefined if final.
	 * @param {Partition} parentPartition
	 * @returns {Partition[] | undefined}
	 */
	expandPartition(parentPartition) {
		if (parentPartition.depth > 0) return;

		const wallZoneType = ZoneTypes.get("wall_zone");
		const newPartitions = [];

		const parentMin = parentPartition.min;
		const parentMax = parentPartition.max;
		const parentSize = parentPartition.size;
		const parentLengthX = parentSize.x;
		const parentLengthZ = parentSize.z;

		const runsAlongX = parentLengthX >= parentLengthZ;

		const wallSize = {
			x: runsAlongX ? parentSize.x : 1,
			y: parentSize.y,
			z: runsAlongX ? 1 : parentSize.z
		};

		const hallwayOrigin = {
			x: parentMin.x + (runsAlongX ? 0 : 1),
			y: parentMin.y,
			z: parentMin.z + (runsAlongX ? 1 : 0)
		};

		const hallwaySize = {
			x: parentSize.x - (runsAlongX ? 0 : 2),
			y: parentSize.y,
			z: parentSize.z - (runsAlongX ? 2 : 0)
		};

		const wallAOrigin = {
			x: parentMin.x,
			y: parentMin.y,
			z: parentMin.z
		};

		const wallBOrigin = {
			x: runsAlongX ? parentMin.x : parentMax.x,
			y: parentMin.y,
			z: runsAlongX ? parentMax.z : parentMin.z
		};

		const hallwayRegion = new Region(hallwayOrigin, hallwaySize);
		const wallRegionA = new Region(wallAOrigin, wallSize);
		const wallRegionB = new Region(wallBOrigin, wallSize);

		const hallwayPartition = new Partition(this, hallwayRegion, parentPartition);
		const wallAZone = new wallZoneType(this.dimensionContext, wallRegionA, this);
		const wallBZone = new wallZoneType(this.dimensionContext, wallRegionB, this);

		newPartitions.push(hallwayPartition);
		newPartitions.push(wallAZone.rootPartition);
		newPartitions.push(wallBZone.rootPartition);

		return newPartitions;
	}
}
