import { Zone } from "../generation/Zone.js";

export class RootZone extends Zone {
	static id = "root_zone";

	constructor(dimensionContext, region, parentZone) {
		super(dimensionContext, region, parentZone);
	}
}
