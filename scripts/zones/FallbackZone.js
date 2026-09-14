import { Zone } from "../generation/Zone.js";

export class FallbackZone extends Zone {
	static id = "fallback_zone";

	/**@type {ZoneConstraints} */
	static constraints = {
		minSize: { x: 1, z: 1 },
		maxSize: { x: 128, z: 128 },
		aspectRatio: undefined
	};

	constructor(dimensionContext, region, parentZone) {
		super(dimensionContext, region, parentZone);
	}
}
