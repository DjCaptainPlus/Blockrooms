import { Region } from "../classes/Region.js";
import { Random } from "../math/Random.js";
import { Partition } from "./Partition.js";


export class Split {
	/**
	 * @param {Partition | Region} partitionOrRegion
	 * @param {SplittingRules} rules
	 * @returns {boolean}
	 */
	static canBeSplit(partitionOrRegion, rules) {
		const { minPartitionSize: minSize, gap } = rules;

		const canSplitX = partitionOrRegion.size.x >= minSize.x * 2 + gap;
		const canSplitZ = partitionOrRegion.size.z >= minSize.z * 2 + gap;

		return canSplitX || canSplitZ;
	}

	/**
	 * Randomly chooses an eligible axis and splits along it.
	 * @param {Partition | Region} partitionOrRegion
	 * @param {Random} random
	 * @param {SplittingRules} rules
	 * @returns {SplitResult | undefined}
	 */
	static random(partitionOrRegion, random, rules) {
		const { minPartitionSize: minSize, gap } = rules;

		const canSplitX = partitionOrRegion.size.x >= minSize.x * 2 + gap;
		const canSplitZ = partitionOrRegion.size.z >= minSize.z * 2 + gap;

		if (canSplitX && canSplitZ) {
			return random.float() < 0.5 ? this.x(partitionOrRegion, random, rules) : this.z(partitionOrRegion, random, rules);
		}

		if (canSplitX) {
			return this.x(partitionOrRegion, random, rules);
		}

		if (canSplitZ) {
			return this.z(partitionOrRegion, random, rules);
		}

		return undefined;
	}

	/**
	 * Splits along X, leaving a separator exactly rules.gap blocks wide.
	 * @param {Partition | Region} partitionOrRegion
	 * @param {Random} random
	 * @param {SplittingRules} rules
	 * @returns {SplitResult | undefined}
	 */
	static x(partitionOrRegion, random, rules) {
		const { min, size } = partitionOrRegion;
		const { minPartitionSize: minSize, gap } = rules;

		if (size.x < minSize.x * 2 + gap) {
			return undefined;
		}

		const widthA = random.intRange(minSize.x, size.x - minSize.x - gap);

		const childA = new Region({ x: min.x, y: min.y, z: min.z }, { x: widthA, y: size.y, z: size.z });

		const separator = gap > 0 ? new Region({ x: min.x + widthA, y: min.y, z: min.z }, { x: gap, y: size.y, z: size.z }) : undefined;

		const childB = new Region({ x: min.x + widthA + gap, y: min.y, z: min.z }, { x: size.x - widthA - gap, y: size.y, z: size.z });

		return { regions: [childA, childB], separator };
	}

	/**
	 * Splits along Z, leaving a separator exactly rules.gap blocks wide.
	 * @param {Partition | Region} partitionOrRegion
	 * @param {Random} random
	 * @param {SplittingRules} rules
	 * @returns {SplitResult | undefined}
	 */
	static z(partitionOrRegion, random, rules) {
		const { min, size } = partitionOrRegion;
		const { minPartitionSize: minSize, gap } = rules;

		if (size.z < minSize.z * 2 + gap) {
			return undefined;
		}

		const lengthA = random.intRange(minSize.z, size.z - minSize.z - gap);

		const childA = new Region({ x: min.x, y: min.y, z: min.z }, { x: size.x, y: size.y, z: lengthA });

		const separator = gap > 0 ? new Region({ x: min.x, y: min.y, z: min.z + lengthA }, { x: size.x, y: size.y, z: gap }) : undefined;

		const childB = new Region({ x: min.x, y: min.y, z: min.z + lengthA + gap }, { x: size.x, y: size.y, z: size.z - lengthA - gap });

		return { regions: [childA, childB], separator };
	}
}
