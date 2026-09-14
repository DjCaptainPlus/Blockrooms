import { world } from "@minecraft/server";
import { Partition } from "../bsp/Partition.js";
import { Split } from "../bsp/SplittingFunctions.js";
import { DimensionContext } from "../classes/DimensionContext.js";
import { Region } from "../classes/Region.js";
import { Random } from "../math/Random.js";
import { RandomFactory } from "../math/RandomFactory.js";
import { RNGStreamNames } from "../types/RNGStreamNames.js";
import { ZoneTypes } from "../zones/ZoneTypes.js";
import { Axis } from "../types/Axis.js";

export class Zone {
	static id = "";

	/**@type {ZoneConstraints} */
	static constraints = {
		minSize: { x: 1, z: 1 },
		maxSize: { x: Infinity, z: Infinity },
		aspectRatio: undefined
	};

	static subdivideRules = {
		enabled: true,
		gap: 1
	};

	static subzoneRules = {
		enabled: true
	};

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

	/**@returns {ZoneConstraints} */
	get constraints() {
		return this.constructor.constraints;
	}

	/**
	 * Expands a partition into children, or returns undefined if final.
	 * @param {Partition} parentPartition
	 * @returns {Partition[] | undefined}
	 */
	expandPartition(parentPartition) {
		const parentRegion = parentPartition.region;
		const selectZoneRandom = this.randomFactory.createStream(parentPartition.identity(), "select_zone");
		const axisRandom = this.randomFactory.createStream(parentPartition.identity(), "split_axis");
		const splitPositionRandom = this.randomFactory.createStream(parentPartition.identity(), "split_position");

		/**@type {Set<ZoneCandidate>} */
		const candidates = new Set();

		for (const zoneType of ZoneTypes.getAll()) {
			if (zoneType.id === "root_zone" || zoneType.id === this.id) continue;

			const splitRanges = zoneType.getValidSplitRanges(parentRegion, 1);

			if (!splitRanges) continue;

			candidates.add({ type: zoneType, splitRanges });
		}

		if (candidates.length === 0) return;

		/**@type {ZoneCandidate[]} */
		const selectedZones = [];

		const selectCount = 2;
		if (candidates.size < selectCount) return;

		const maxAttempts = 6;
		let attempts = 0;
		while (selectedZones.length < selectCount) {
			const randomIndex = Math.floor(selectZoneRandom.float() * candidates.size);
			const selectedZone = Array.from(candidates)[randomIndex];

			selectedZones.push(selectedZone);
			candidates.delete(selectedZone);

			if (++attempts >= maxAttempts) {
				const thisType = ZoneTypes.get(this.id);
				const zonesNeeded = selectCount - selectedZones.length;

				if (zonesNeeded > 0) {
					for (let i = 0; i < zonesNeeded; i++) {
						selectedZones.push({ type: thisType, splitRanges: thisType.getValidSplitRanges(parentRegion, 1) });
					}
				}

				break;
			}
		}

		const getSharedRange = (axis) => {
			const range1 = selectedZones[0].splitRanges[axis];
			const range2 = selectedZones[1].splitRanges[axis];

			if (!range1 || !range2) return;

			const availableSpace = parentRegion.size[axis] - 1;
			const min = Math.max(range1.min, availableSpace - range2.max);
			const max = Math.min(range1.max, availableSpace - range2.min);

			if (min > max) return;

			return { min, max };
		};

		const xRange = getSharedRange(Axis.x);
		const zRange = getSharedRange(Axis.z);

		const xSplitAllowed = xRange !== undefined;
		const zSplitAllowed = zRange !== undefined;

		const subzoneX = () => {
			const xSplit = splitPositionRandom.intRange(xRange.min, xRange.max);

			const [regionA, gap, regionB] = parentRegion.split(Axis.x, xSplit, xSplit + 1);

			const zoneA = new selectedZones[0].type(this.dimensionContext, regionA);
			const zoneB = new selectedZones[1].type(this.dimensionContext, regionB);

			return [zoneA.rootPartition, zoneB.rootPartition];
		};

		const subzoneZ = () => {
			const zSplit = splitPositionRandom.intRange(zRange.min, zRange.max);

			const [regionA, gap, regionB] = parentRegion.split(Axis.z, zSplit, zSplit + 1);

			const zoneA = new selectedZones[0].type(this.dimensionContext, regionA);
			const zoneB = new selectedZones[1].type(this.dimensionContext, regionB);

			return [zoneA.rootPartition, zoneB.rootPartition];
		};

		if (xSplitAllowed && zSplitAllowed) {
			const roll = axisRandom.float();

			if (roll < 0.5) {
				return subzoneX();
			} else {
				return subzoneZ();
			}
		} else if (xSplitAllowed) {
			return subzoneX();
		} else if (zSplitAllowed) {
			return subzoneZ();
		}
	}

	/**
	 * Determines if a given region can be occupied by this Zone type.
	 * @param {Region} region
	 */
	static canOccupy(region) {
		return true;
	}

	/**
	 * Calculates the valid split ranges for both axes within a region, considering the zone's constraints and a specified gap.
	 * @param {Region} region
	 * @param {number} gap
	 * @returns {{x: ValueRange|undefined, z: ValueRange|undefined}|undefined}
	 */
	static getValidSplitRanges(region, gap) {
		const x = this.getLengthRange(region, Axis.x, gap);
		const z = this.getLengthRange(region, Axis.z, gap);

		if (!x && !z) return undefined;

		return { x, z };
	}

	/**
	 * Calculates the valid length range for a given axis within a region, considering the zone's constraints and a specified gap.
	 * @param {Region} region
	 * @param {Axis} axis
	 * @param {number} gap
	 * @returns {ValueRange}
	 */
	static getLengthRange(region, axis, gap) {
		const aspectRatio = this.constraints.aspectRatio;
		const minSize = this.constraints.minSize;
		const maxSize = this.constraints.maxSize;

		const availableLength = region.size[axis] - gap;
		const fixedAxis = Axis.other(axis);
		const fixedLength = region.size[fixedAxis];

		if (availableLength < minSize[axis]) return;
		if (fixedLength < minSize[fixedAxis]) return;
		if (fixedLength > maxSize[fixedAxis]) return;

		if (!aspectRatio) {
			const min = minSize[axis];
			const max = Math.min(availableLength, maxSize[axis]);

			return { min, max };
		}

		const requiredLength = axis === Axis.x ? fixedLength * aspectRatio : fixedLength / aspectRatio;

		if (!Number.isInteger(requiredLength)) return;
		if (requiredLength < minSize[axis]) return;
		if (requiredLength > maxSize[axis]) return;
		if (requiredLength > availableLength) return;

		return { min: requiredLength, max: requiredLength };
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

	/**
	 * Creates a child zone within the given region.
	 * @param {string} zoneId
	 * @param {Region} region
	 * @returns {Zone}
	 */
	createSubzone(zoneId, region) {
		const ZoneClass = ZoneTypes.get(zoneId);
		return new ZoneClass(this.dimensionContext, region, this);
	}
}
