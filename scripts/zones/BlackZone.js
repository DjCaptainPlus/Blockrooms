import { Zone } from "../generation/Zone.js";

export class BlackZone extends Zone {
    static id = "black_zone";

    /**@type {ZoneConstraints} */
    static constraints = {
		minSize: { x: 0, z: 0 },
		maxSize: { x: Infinity, z: Infinity },
		aspectRatio: 1 / 2
	};

    constructor(dimensionContext, region, parentZone) {
        super(dimensionContext, region, parentZone);
    }
}