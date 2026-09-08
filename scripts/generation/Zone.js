import { world } from "@minecraft/server";
import { Partition } from "../bsp/Partition.js";
import { Split } from "../bsp/SplittingFunctions.js";
import { DimensionContext } from "../classes/DimensionContext.js";
import { Region } from "../classes/Region.js";
import { Random } from "../math/Random.js";
import { RandomFactory } from "../math/RandomFactory.js";
import { RNGStreamNames } from "../types/RNGStreamNames.js";
import { ZoneTypes } from "../zones/ZoneTypes.js";

export class Zone {
	static id = "";

	static constraints = {
		minSize: { x: 32, z: 32 },
		maxSize: { x: 128, z: 128 },
		preferredSize: { x: 96, z: 96 },
		aspectRatio: 1 / 1
	};

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
		gap: 1
	};

	static subzoneRules = {
		selectionDepth: 25
	};

	/**@type {SubzoneType[]} */
	static subzoneTypes = [];

	/**
	 * Creates a new Zone instance.
	 * @param {DimensionContext} dimensionContext
	 * @param {Region} region
	 * @param {Zone} [parentZone]
	 */
	constructor(dimensionContext, region, parentZone) {
		if (new.target === Zone) {
			throw new TypeError("Zone is an abstract class and cannot be instantiated directly.");
		}

		/**@type {DimensionContext} */
		this.dimensionContext = dimensionContext;

		/**@type {Region} */
		this.region = region;

		/**@type {Zone|undefined} */
		this.parentZone = parentZone || undefined;

		/**@type {number} */
		this.zoneDepth = this.parentZone ? this.parentZone.zoneDepth + 1 : 0;

		/**@type {Partition} */
		this.rootPartition = this._createRootPartition();

		/**@type {RandomFactory} */
		this.randomFactory = new RandomFactory(Random.hashString(world.seed));
	}

	/** @returns {Partition} */
	_createRootPartition() {
		return new Partition(this, this.region);
	}

	/** @returns {Vector3} */
	get origin() {
		return this.region.origin;
	}

	/** @returns {Vector3} */
	get size() {
		return this.region.size;
	}

	/**@return {string} */
	static get id() {
		throw new Error("Zone subclass must define a static id.");
	}

	/**@return {string} */
	get id() {
		return this.constructor.id;
	}

	/**@return {SplittingRules} */
	get splittingRules() {
		return this.constructor.splittingRules;
	}

	/**@return {SubzoneRules} */
	get subzoneRules() {
		return this.constructor.subzoneRules;
	}

	/**@returns {SubzoneType[]} */
	get subzoneTypes() {
		return this.constructor.subzoneTypes;
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

		const wallZoneType = ZoneTypes.get("wall_zone");
		const wallZone = new wallZoneType(this.dimensionContext, separator, this);

		newPartitions.push(wallZone.rootPartition);

		return newPartitions;
	}

	/**
	 * Determines if a given region can be occupied by this Zone type.
	 * @param {Region} region
	 */
	static canOccupy(region) {
		return true;
	}

	/**
	 * Determines if a given partition can be subdivided by this zone.
	 * @param {Partition} partition
	 * @returns {boolean}
	 */
	canSubdivide(partition) {
		const canSplitX = partition.size.x >= this.splittingRules.minPartitionSize.x * 2 + this.splittingRules.gap;
		const canSplitZ = partition.size.z >= this.splittingRules.minPartitionSize.z * 2 + this.splittingRules.gap;

		return canSplitX || canSplitZ;
	}

	/**
	 * Determines if a given partition should be subdivided based on the zone's splitting rules and a random number generator.
	 * @param {Partition} partition
	 * @returns {boolean}
	 */
	shouldSubdivide(partition) {
		const identity = partition.identity();
		const subdivideRollStream = this.randomFactory.createStream(identity, RNGStreamNames.SUBDIVIDE_ROLL);

		const subdivideRoll = subdivideRollStream.float();

		if (subdivideRoll < this.splittingRules.splitChance) {
			return true;
		}

		return false;
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

		return Split.random(partition, subdivideStream, this.splittingRules);
	}

	/**
	 * Determines if a child region should be treated as a subzone based on the zone's subzone rules and the depth of the parent partition.
	 * @param {Region} childRegion
	 * @param {Partition} parentPartition
	 * @returns {boolean}
	 */
	shouldSubzone(childRegion, parentPartition) {
		const childDepth = parentPartition.depth + 1;

		return childDepth === this.subzoneRules.selectionDepth;
	}

	/**
	 * Selects an appropriate subzone type for a given child region based on the available subzone types and their ability to occupy the region.
	 * @param {Region} childRegion
	 * @param {Partition} parentPartition
	 * @returns {typeof Zone|undefined} The selected subzone type or undefined if no suitable type is found.
	 */
	selectSubzoneType(childRegion, parentPartition) {
		const availableZones = this.subzoneTypes.filter((subzoneType) => ZoneTypes.get(subzoneType.typeId).canOccupy(childRegion));

		if (availableZones.length === 0) return undefined;

		const childIdentity = `${parentPartition.identity()}:${childRegion.identity()}`;

		const subzoneTypeStream = this.randomFactory.createStream(childIdentity, RNGStreamNames.SUBZONE_TYPE);
		const randomIndex = Math.floor(subzoneTypeStream.float() * availableZones.length);

		return ZoneTypes.get(availableZones[randomIndex].typeId);
	}
}
