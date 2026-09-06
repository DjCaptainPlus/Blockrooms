import { Zone } from "../generation/Zone.js";

export class BasicZone extends Zone {
	static id = "basic_zone";

	static subzoneTypes = [
		{ typeId: "basic_zone", weight: 1 },
		{ typeId: "other_zone", weight: 1 },
		{ typeId: "yet_another_zone", weight: 1 }
	];

	static subzoneRules = {
		selectionDepth: 1
	};

	constructor(dimensionContext, region, parentZone) {
		super(dimensionContext, region, parentZone);
	}
}
