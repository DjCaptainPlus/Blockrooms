import { BlockVolume } from "@minecraft/server";
import { Partition } from "./Partition.js";
import { SpacePartitioner } from "./SpacePartitioner.js";
import { Random } from "../math/Random.js";

export class InfiniteGenerator {
	constructor() {
		/** @type {number} */
		this.seed = 123456789;

		/** @type {{ x: number, z: number }} */
		this.maxRoomDimensions = {
			x: 64,
			z: 64
		};

		/** @type {SpacePartitioner} */
		this.partitioner = new SpacePartitioner(this.seed);

		/** @type {Partition} */
		this.root = new Partition(
			{
				x: -500000,
				y: 0,
				z: -500000
			},
			{
				x: 1000000,
				y: 1,
				z: 1000000
			}
		);
	}

	/**
	 * Gets every final partition that intersects the given regions,
	 * along with every split that touches one of those partitions.
	 *
	 * Only branches of the BSP tree that intersect the requested regions
	 * are evaluated.
	 *
	 * @param {BlockVolume[]} areas
	 * @returns {{
	 *     partitions: Partition[],
	 *     splits: { min: Vector3, max: Vector3 }[]
	 * }}
	 */
	getPartitions(areas) {
		/** @type {Partition[]} */
		const partitions = [];

		/** @type {{ min: Vector3, max: Vector3 }[]} */
		const splits = [];

		/** @type {Partition[]} */
		const stack = [this.root];

		while (stack.length > 0) {
			const partition = stack.pop();

			if (!partition.intersectsAny(areas)) {
				continue;
			}

			const random = new Random(Random.hashString(JSON.stringify(partition)));
			const skipRoll = random.float();

			const canSkipSplitting =
				partition.size.x <= this.maxRoomDimensions.x &&
				partition.size.z <= this.maxRoomDimensions.z;

			if (canSkipSplitting && skipRoll < 0.5) {
				partitions.push(partition);
				continue;
			}

			const result = this.partitioner.split(partition);

			if (result.split === null) {
				partitions.push(partition);
				continue;
			}

			splits.push(result.split);

			for (const child of result.partitions) {
				if (child.intersectsAny(areas)) {
					stack.push(child);
				}
			}
		}

		return {
			partitions,
			splits: splits.filter((split) =>
				partitions.some((partition) => this._splitTouchesPartition(split, partition))
			)
		};
	}

	/**
	 * @param {{ min: Vector3, max: Vector3 }} split
	 * @param {Partition} partition
	 * @returns {boolean}
	 */
	_splitTouchesPartition(split, partition) {
		const isXSplit = split.min.x === split.max.x;

		if (isXSplit) {
			const touchesX =
				partition.max.x + 1 === split.min.x ||
				partition.min.x - 1 === split.min.x;

			const overlapsZ =
				partition.max.z >= split.min.z &&
				partition.min.z <= split.max.z;

			return touchesX && overlapsZ;
		}

		const touchesZ =
			partition.max.z + 1 === split.min.z ||
			partition.min.z - 1 === split.min.z;

		const overlapsX =
			partition.max.x >= split.min.x &&
			partition.min.x <= split.max.x;

		return touchesZ && overlapsX;
	}
}