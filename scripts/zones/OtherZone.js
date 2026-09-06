import { Zone } from "../generation/Zone.js";

export class OtherZone extends Zone {
	static id = "other_zone";

	static subzoneTypes = [
		{ typeId: "basic_zone", weight: 1 },
		{ typeId: "other_zone", weight: 1 },
		{ typeId: "yet_another_zone", weight: 1 }
	];

	static subzoneRules = {
		minimumDepth: 16,
		forcedDepth: 50,
		selectionDepth: 1,
		chance: 0.5
	};

	static splittingRules = {
		minPartitionSize: {
			x: 16,
			y: 8,
			z: 16
		},
		maxPartitionSize: {
			x: 64,
			y: 64,
			z: 64
		},
		splitChance: 0.5,
		gap: 1
	};

	constructor(dimensionContext, region, parentZone) {
		super(dimensionContext, region, parentZone);
	}
}
