import { Zone } from "../generation/Zone.js";


export class YetAnotherZone extends Zone {
	static id = "yet_another_zone";

	static subzoneTypes = [
		{ typeId: "basic_zone", weight: 1 },
		{ typeId: "other_zone", weight: 1 },
		{ typeId: "yet_another_zone", weight: 1 }
	];

	static subzoneRules = {
		minimumDepth: 16,
		forcedDepth: 50,
		selectionDepth: 5,
		chance: 0.1
	};

	static splittingRules = {
		minPartitionSize: {
			x: 32,
			y: 8,
			z: 4
		},
		maxPartitionSize: {
			x: 64,
			y: 64,
			z: 64
		},
		splitChance: 0.9,
		gap: 1
	};

	constructor(dimensionContext, region, parentZone) {
		super(dimensionContext, region, parentZone);
	}
}
