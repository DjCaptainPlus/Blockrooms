import { BlockVolume } from "@minecraft/server";
import { Partition } from "../bsp/Partition.js";
import { Random } from "./Random.js";

const random = new Random(123456789);

/**
 * @typedef {object} BSPConfig
 * @property {number} minRoomXSize
 * @property {number} minRoomZSize
 * @property {number} splitProbability
 * @property {number} wallHeight
 */

/**
 *
 * @param {Partition} spaceToSplit
 * @param {BSPConfig} config
 * @returns {Generator<undefined, { partitions: Set<Partition>, wallVolumes: BlockVolume[] }>}
 */
export function* binarySpacePartitioning(spaceToSplit, config) {
	const canBePartitioned = spaceToSplit.size.x >= config.minRoomXSize * 2 || spaceToSplit.size.z >= config.minRoomZSize * 2;

	if (!canBePartitioned) {
		throw new Error("Space is too small to partition");
	}

	/**@type {Set<Partition>} */
	const spacesToProcess = new Set();
	spacesToProcess.add(spaceToSplit);

	const partitions = new Set();

	/**@type {BlockVolume[]} */
	const wallVolumes = [];

	const MAX_SPACES_PROCESSED_PER_TICK = 2048;
	let spacesProcessed = 0;

	for (const space of spacesToProcess) {
		if (++spacesProcessed >= MAX_SPACES_PROCESSED_PER_TICK) {
			spacesProcessed = 0;
			yield;
		}

		const isBigEnough = space.size.x >= config.minRoomXSize && space.size.z >= config.minRoomZSize;
		const canSplitX = space.size.x >= config.minRoomXSize * 2 + 1;
		const canSplitZ = space.size.z >= config.minRoomZSize * 2 + 1;
		const canBeSplit = canSplitX || canSplitZ;

		if (!isBigEnough) {
			spacesToProcess.delete(space);
			continue;
		}

		if (!canBeSplit) {
			partitions.add(space);
			spacesToProcess.delete(space);
			continue;
		}

		if (random.float() > config.splitProbability) {
			partitions.add(space);
			spacesToProcess.delete(space);
			continue;
		}

		let newSpaces;

		if (canSplitX && canSplitZ) {
			if (random.float() < 0.5) {
				newSpaces = _splitX(space, config, wallVolumes);
			} else {
				newSpaces = _splitZ(space, config, wallVolumes);
			}
		} else if (canSplitX) {
			newSpaces = _splitX(space, config, wallVolumes);
		} else if (canSplitZ) {
			newSpaces = _splitZ(space, config, wallVolumes);
		}

		spacesToProcess.add(newSpaces[0]);
		spacesToProcess.add(newSpaces[1]);

		spacesToProcess.delete(space);
		//CHANCE_TO_SKIP += 0.01;
	}

	return { partitions, wallVolumes };
}

const GENEROUS_PARTITIONING = false;

/**
 *
 * @param {Partition} space
 * @param {BSPConfig} config
 * @returns {Partition[]}
 */
function _splitX(space, config, wallVolumes) {
	let splitX;

	if (GENEROUS_PARTITIONING) {
		splitX = random.intRange(1, space.size.x);
	} else {
		splitX = random.intRange(config.minRoomXSize, space.size.x - config.minRoomXSize - 1);
	}

	const space1 = new Partition(space.min, { x: splitX, y: space.size.y, z: space.size.z });
	const space2 = new Partition({ x: space.min.x + splitX + 1, y: space.min.y, z: space.min.z }, { x: space.size.x - splitX - 1, y: space.size.y, z: space.size.z });

	const wallVolumeStart = {
		x: space.min.x + splitX,
		y: space.min.y,
		z: space.min.z
	};

	const wallVolumeEnd = {
		x: space.min.x + splitX,
		y: space.min.y + config.wallHeight - 1,
		z: space.min.z + space.size.z - 1
	};

	wallVolumes.push(new BlockVolume(wallVolumeStart, wallVolumeEnd));

	return [space1, space2];
}

/**
 *
 * @param {Partition} space
 * @param {BSPConfig} config
 * @returns {Partition[]}
 */
function _splitZ(space, config, wallVolumes) {
	let splitZ;

	if (GENEROUS_PARTITIONING) {
		splitZ = random.intRange(1, space.size.z);
	} else {
		splitZ = random.intRange(config.minRoomZSize, space.size.z - config.minRoomZSize - 1);
	}

	const space1 = new Partition(space.min, { x: space.size.x, y: space.size.y, z: splitZ });
	const space2 = new Partition({ x: space.min.x, y: space.min.y, z: space.min.z + splitZ + 1 }, { x: space.size.x, y: space.size.y, z: space.size.z - splitZ - 1 });

	const wallVolumeStart = {
		x: space.min.x,
		y: space.min.y,
		z: space.min.z + splitZ
	};

	const wallVolumeEnd = {
		x: space.min.x + space.size.x - 1,
		y: space.min.y + config.wallHeight - 1,
		z: space.min.z + splitZ
	};

	wallVolumes.push(new BlockVolume(wallVolumeStart, wallVolumeEnd));

	return [space1, space2];
}
