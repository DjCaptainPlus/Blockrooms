import { Random } from "../math/Random.js";
import { Partition } from "./Partition.js";

export class SpacePartitioner {
	constructor(seed) {
		this.seed = seed;

		this.random;
	}

	/**
	 * Splits a given partition into smaller partitions based on the specified rules and randomization.
	 *
	 * @param {Partition} partition
	 * @returns {{
	 *     partitions: Partition[],
	 *     split: { min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } } | null
	 * }}
	 */
	split(partition) {
		this.random = new Random(this._hashPartition(partition));

		const canSplitX = partition.size.x >= 8 * 2 + 1;
		const canSplitZ = partition.size.z >= 8 * 2 + 1;

		if (canSplitX && canSplitZ) {
			if (this.random.float() < 0.5) {
				return this._splitAlongX(partition);
			} else {
				return this._splitAlongZ(partition);
			}
		} else if (canSplitX) {
			return this._splitAlongX(partition);
		} else if (canSplitZ) {
			return this._splitAlongZ(partition);
		} else {
			return {
				partitions: [partition],
				split: null
			};
		}
	}

	// **************
	// ** Internal **
	// **************

	/**
	 * Generates a hash value for a given partition based on its properties and the seed.
	 *
	 * @param {Partition} partition
	 * @returns {number}
	 */
	_hashPartition(partition) {
		return Random.hashNumbers(this.seed, partition.origin.x, partition.origin.y, partition.origin.z, partition.size.x, partition.size.y, partition.size.z);
	}

	/**
	 * Splits a given partition into two new partitions along the X-axis.
	 *
	 * @param {Partition} parent
	 * @returns {{
	 *     partitions: [Partition, Partition],
	 *     split: { min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } }
	 * }}
	 */
	_splitAlongX(parent) {
		const minRoomX = 8;

		const splitX = this.random.intRange(minRoomX, parent.size.x - minRoomX - 1);
		const splitWorldX = parent.min.x + splitX;

		const partitionA = new Partition(parent.min, {
			x: splitX,
			y: parent.size.y,
			z: parent.size.z
		});

		const partitionB = new Partition(
			{
				x: splitWorldX + 1,
				y: parent.min.y,
				z: parent.min.z
			},
			{
				x: parent.size.x - splitX - 1,
				y: parent.size.y,
				z: parent.size.z
			}
		);

		const split = {
			min: {
				x: splitWorldX,
				y: 0,
				z: parent.min.z
			},
			max: {
				x: splitWorldX,
				y: 0,
				z: parent.min.z + parent.size.z - 1
			}
		};

		return {
			partitions: [partitionA, partitionB],
			split
		};
	}

	/**
	 * Splits a given partition into two new partitions along the Z-axis.
	 *
	 * @param {Partition} parent
	 * @returns {{
	 *     partitions: [Partition, Partition],
	 *     split: { min: { x: number, y: number, z: number }, max: { x: number, y: number, z: number } }
	 * }}
	 */
	_splitAlongZ(parent) {
		const minRoomZ = 8;

		const splitZ = this.random.intRange(minRoomZ, parent.size.z - minRoomZ - 1);
		const splitWorldZ = parent.min.z + splitZ;

		const partitionA = new Partition(parent.min, {
			x: parent.size.x,
			y: parent.size.y,
			z: splitZ
		});

		const partitionB = new Partition(
			{
				x: parent.min.x,
				y: parent.min.y,
				z: splitWorldZ + 1
			},
			{
				x: parent.size.x,
				y: parent.size.y,
				z: parent.size.z - splitZ - 1
			}
		);

		const split = {
			min: {
				x: parent.min.x,
				y: 0,
				z: splitWorldZ
			},
			max: {
				x: parent.min.x + parent.size.x - 1,
				y: 0,
				z: splitWorldZ
			}
		};

		return {
			partitions: [partitionA, partitionB],
			split
		};
	}
}
