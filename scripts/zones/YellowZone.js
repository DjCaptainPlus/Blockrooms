import { Zone } from "../generation/Zone.js";

export class YellowZone extends Zone {
	static id = "yellow_zone";

	/**@type {ZoneConstraints} */
	static constraints = {
		minSize: { x: 4, z: 4 },
		maxSize: { x: Infinity, z: Infinity },
		aspectRatio: undefined
	};

	constructor(dimensionContext, region, parentZone) {
		super(dimensionContext, region, parentZone);
	}
}
