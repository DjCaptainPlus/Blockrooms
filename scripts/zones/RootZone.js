import { Partition } from "../bsp/Partition.js";
import { Split } from "../bsp/SplittingFunctions.js";
import { Region } from "../classes/Region.js";
import { Zone } from "../generation/Zone.js";
import { RNGStreamNames } from "../types/RNGStreamNames.js";
import { ZoneTypes } from "./ZoneTypes.js";

export class RootZone extends Zone {
	static id = "root_zone";

	static splittingRules = {
		minPartitionSize: {
			x: 8,
			y: 8,
			z: 8
		},
		maxPartitionSize: {
			x: 64,
			y: 64,
			z: 64
		},
		splitChance: 1,
		gap: 9
	};

	static subzoneRules = {
		selectionDepth: 29
	};

	static subzoneTypes = [{ typeId: "basic_zone", weight: 1 }];

	constructor(dimensionContext, region, parentZone) {
		super(dimensionContext, region, parentZone);
	}

	/**
	 * Expands a partition into children, or returns undefined if final.
	 * @param {Partition} parentPartition
	 * @returns {Partition[] | undefined}
	 */
	expandPartition(parentPartition) {
		if (!this.canSubdivide(parentPartition)) return undefined;

		const newPartitions = [];
		const shouldSubdivide = this.shouldSubdivide(parentPartition);

		if (!shouldSubdivide) return undefined;

		const { regions: childRegions, separator } = this.subdivide(parentPartition);

		for (const region of childRegions) {
			const shouldSubzone = this.shouldSubzone(region, parentPartition);

			if (!shouldSubzone) {
				newPartitions.push(new Partition(this, region, parentPartition));
				continue;
			}

			const zoneType = this.selectSubzoneType(region, parentPartition);

			if (!zoneType) {
				newPartitions.push(new Partition(this, region, parentPartition));
				continue;
			}

			const newZone = new zoneType(this.dimensionContext, region, this);

			newPartitions.push(newZone.rootPartition);
		}

		const hallwayZoneType = ZoneTypes.get("hallway_zone");
		const hallWayZone = new hallwayZoneType(this.dimensionContext, separator, this);
		newPartitions.push(hallWayZone.rootPartition);

		return newPartitions;
	}

	/**
	 * Subdivides a given partition into two new regions based on the zone's splitting rules and a random number generator.
	 * @param {Partition} partition
	 * @returns {SplitResult}
	 * @throws {Error} If the partition cannot be subdivided.
	 */
	subdivide(partition) {
		if (!this.canSubdivide(partition)) {
			throw new Error(`Cannot subdivide partition ${partition.identity()}.`);
		}

		const identity = partition.identity();
		const subdivideStream = this.randomFactory.createStream(identity, RNGStreamNames.SUBDIVIDE);

		const xLength = partition.size.x;
		const zLength = partition.size.z;

		const splitOnX = xLength >= zLength;
		const splitOnZ = zLength > xLength;

		if (splitOnX) {
			return Split.x(partition, subdivideStream, this.splittingRules);
		} else if (splitOnZ) {
			return Split.z(partition, subdivideStream, this.splittingRules);
		}
	}
}
