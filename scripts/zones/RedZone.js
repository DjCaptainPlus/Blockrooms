import { Zone } from "../generation/Zone.js";

export class RedZone extends Zone {
	static id = "red_zone";

	/**@type {ZoneConstraints} */
	static constraints = {
		minSize: { x: 4, z: 4 },
		maxSize: { x: Infinity, z: Infinity },
		aspectRatio: 1/1
	};

	constructor(dimensionContext, region, parentZone) {
		super(dimensionContext, region, parentZone);
	}
}
