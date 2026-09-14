import { BlockTypes, BlockVolume, Dimension, Direction, Player, world } from "@minecraft/server";
import { DimensionContext } from "./DimensionContext.js";
import { Cell } from "../cell/Cell.js";
import { SpacePartitioner } from "../bsp/SpacePartitioner.js";
import { Partition } from "../bsp/Partition.js";
import { InfiniteGenerator } from "../bsp/InfiniteGenerator.js";
import { Random } from "../math/Random.js";
import { blockRooms } from "../main.js";
import { DimensionGenerator } from "../generation/DimensionGenerator.js";
import { ZoneTypes } from "../zones/ZoneTypes.js";

const MAX_VOLUME_CAPACITY = 128;
const maxVolumesProcessed = 64;
const maxPositionsProcessed = 128;
const maxWallsProcessed = 64;
const maxVolumesPlaced = 4;
const wallHeight = 7;
const openingCount = 2;

const minLightCount = 2;
const maxLightCount = 12;
const lightWallBuffer = 2;
const lightSpacing = 1;
const maxLightRows = 3;

const floorBlock = "minecraft:birch_planks";
const wallBlock = "minecraft:dark_oak_planks";
const ceilingBlock = "minecraft:birch_planks";
const lightBlock = "minecraft:ochre_froglight";

export class DimensionContextRegistry {
	constructor() {
		/**@type {Map<string, DimensionContext>} */
		this.contexts = new Map();

		// Custom dimensions.
		this._registerDimension("blockrooms:blockrooms", testGenerator);
	}

	get allDimensions() {
		return [...this.contexts.values()].map((context) => context.dimension);
	}

	/**
	 * Retrieves the DimensionContext associated with the given dimension ID.
	 * @param {string|Dimension} dimensionId
	 * @returns {DimensionContext}
	 */
	get(dimensionOrId) {
		const dimensionId = typeof dimensionOrId === "string" ? dimensionOrId : dimensionOrId.id;

		if (!this.contexts.has(dimensionId)) {
			throw new Error(`Dimension context with ID "${dimensionId}" is not registered.`);
		}

		return this.contexts.get(dimensionId);
	}

	/**
	 * Checks if a DimensionContext with the given ID is registered.
	 * @param {string} dimensionId
	 * @returns {boolean}
	 */
	has(dimensionId) {
		return this.contexts.has(dimensionId);
	}

	// **************
	// ** Internal **
	// **************

	/**
	 * Registers a new dimension context with the given ID and generator function.
	 * @param {string} id
	 * @param {} generator
	 */
	_registerDimension(id, generator) {
		if (this.contexts.has(id)) {
			throw new Error(`Dimension context with ID "${id}" is already registered.`);
		}

		const context = new DimensionContext(id, generator);
		this.contexts.set(id, context);
	}
}

// temp
/**
 *
 * @param {Cell} cell
 * @param {Player} player
 * @param {DimensionContext} context
 */
function* testGenerator(cell, player, context) {
	if (cell.min.y > 0 || cell.min.y < 0) return;

	const maxPartitionsProcessed = 128;
	const maxVolumesPlaced = 4;

	const generator = new DimensionGenerator({ dimensionContext: context, rootZone: ZoneTypes.get("root_zone") });

	const cellVolume = new BlockVolume(cell.min, cell.max);

	const partitions = generator.getPartitions(cellVolume);

	if (partitions.length === 0) {
		//blockRooms.message("Ain't no partitions :(");
	}

	const floorVolumes = [];

	let partitionsProcessed = 0;
	for (const partition of partitions) {
		const min = partition.min;
		const max = partition.max;

		const floorVolume = new BlockVolume({ x: min.x, y: 0, z: min.z }, { x: max.x, y: 0, z: max.z });
		const croppedVolume = cropVolumeToCell(floorVolume, cell);

		if (!croppedVolume) continue;

		if (croppedVolume.getCapacity() > MAX_VOLUME_CAPACITY) {
			const subVolumes = subdivideVolume(croppedVolume);

			subVolumes.forEach((subVolume) => {
				floorVolumes.push({ volume: subVolume, zone: partition.zone.id });
			});
		} else {
			floorVolumes.push({ volume: croppedVolume, zone: partition.zone.id });
		}

		if (++partitionsProcessed >= maxPartitionsProcessed) {
			partitionsProcessed++;
			yield;
		}
	}

	let volumesPlaced = 0;
	for (const { volume, zone } of floorVolumes) {
		try {
			let blockId = "stone";

			switch (zone) {
				case "basic_zone": {
					blockId = "minecraft:red_wool";
					break;
				}
				case "other_zone": {
					blockId = "minecraft:blue_wool";
					break;
				}
				case "yet_another_zone": {
					blockId = "minecraft:lime_wool";
					break;
				}
				case "root_zone": {
					blockId = "minecraft:black_wool";
					break;
				}
				case "hallway_zone": {
					blockId = "minecraft:brown_wool";
					break;
				}
				case "wall_zone": {
					blockId = "minecraft:gray_wool";
					break;
				}
				case "fallback_zone": {
					blockId = "minecraft:green_wool";
					break;
				}
			}

			context.dimension.fillBlocks(volume, blockId);

			if (++volumesPlaced >= maxVolumesPlaced) {
				volumesPlaced = 0;
				yield;
			}
		} catch (e) {
			blockRooms.message(`Could not place volume: ${e.message}`);
		}
	}

	const markerPosition = cell.min;
	context.dimension.setBlockType(markerPosition, "minecraft:bedrock");
}

/**
 *
 * @param {Vector3} position
 * @param {Cell} cell
 */
function positionIsInsideCell(position, cell) {
	const cellMin = cell.min;
	const cellMax = cell.max;

	if (position.x >= cellMin.x && position.x <= cellMax.x && position.y >= cellMin.y && position.y <= cellMax.y && position.z >= cellMin.z && position.z <= cellMax.z) {
		return true;
	}
}

/**
 *
 * @param {BlockVolume} volume
 * @param {Cell} cell
 */
function cropVolumeToCell(volume, cell) {
	const cellMin = cell.min;
	const cellMax = cell.max;

	const volumeMin = volume.getMin();
	const volumeMax = volume.getMax();

	const croppedMin = { x: Math.max(cellMin.x, volumeMin.x), y: Math.max(cellMin.y, volumeMin.y), z: Math.max(cellMin.z, volumeMin.z) };
	const croppedMax = { x: Math.min(cellMax.x, volumeMax.x), y: Math.min(cellMax.y, volumeMax.y), z: Math.min(cellMax.z, volumeMax.z) };

	const intersects = croppedMin.x <= croppedMax.x && croppedMin.y <= croppedMax.y && croppedMin.z <= croppedMax.z;

	if (intersects) {
		return new BlockVolume(croppedMin, croppedMax);
	}

	return undefined;
}

/**
 * Subdivides a block volume until every resulting volume
 * contains no more than the maximum allowed number of blocks.
 *
 * @param {BlockVolume} volume
 * @returns {BlockVolume[]}
 */
function subdivideVolume(volume) {
	const results = [];
	const stack = [volume];

	while (stack.length > 0) {
		const current = stack.pop();

		if (current.getCapacity() <= MAX_VOLUME_CAPACITY) {
			results.push(current);
			continue;
		}

		const min = current.getMin();
		const max = current.getMax();

		const sizeX = max.x - min.x + 1;
		const sizeY = max.y - min.y + 1;
		const sizeZ = max.z - min.z + 1;

		if (sizeX >= sizeY && sizeX >= sizeZ) {
			const split = Math.floor((min.x + max.x) / 2);

			stack.push(new BlockVolume(min, { x: split, y: max.y, z: max.z }), new BlockVolume({ x: split + 1, y: min.y, z: min.z }, max));
		} else if (sizeY >= sizeZ) {
			const split = Math.floor((min.y + max.y) / 2);

			stack.push(new BlockVolume(min, { x: max.x, y: split, z: max.z }), new BlockVolume({ x: min.x, y: split + 1, z: min.z }, max));
		} else {
			const split = Math.floor((min.z + max.z) / 2);

			stack.push(new BlockVolume(min, { x: max.x, y: max.y, z: split }), new BlockVolume({ x: min.x, y: min.y, z: split + 1 }, max));
		}
	}

	return results;
}
