import { BasicZone } from "./BasicZone.js";
import { HallwayZone } from "./HallwayZone.js";
import { OtherZone } from "./OtherZone.js";
import { RootZone } from "./RootZone.js";
import { WallZone } from "./WallZone.js";
import { YetAnotherZone } from "./YetAnotherZone.js";
import { ZoneTypes } from "./ZoneTypes.js";

const registry = [BasicZone, OtherZone, YetAnotherZone, RootZone, HallwayZone, WallZone];

export function registerZones() {
	for (const zoneType of registry) {
		try {
			if (ZoneTypes.types.has(zoneType.id)) {
				throw new Error(`Zone already registered.`);
			}

			ZoneTypes.register(zoneType);

			// Log successful registration.
			console.log(`Registered Zone '${zoneType.id}'`);
		} catch (error) {
			console.error(`Unable to register Zone '${zoneType.id}': ${error.message}'`);
		}
	}
}
