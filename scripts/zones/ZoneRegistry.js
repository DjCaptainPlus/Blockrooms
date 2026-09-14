import { BlackZone } from "./BlackZone.js";
import { FallbackZone } from "./FallbackZone.js";
import { RedZone } from "./RedZone.js";
import { RootZone } from "./RootZone.js";
import { YellowZone } from "./YellowZone.js";
import { ZoneTypes } from "./ZoneTypes.js";

const registry = [BlackZone, RedZone, YellowZone, RootZone, FallbackZone];

export function registerZones() {
	for (const zoneType of registry) {
		try {
			if (ZoneTypes.types.has(zoneType.id)) {
				throw new Error(`Zone already registered.`);
			}

			ZoneTypes.register(zoneType);

			// Log successful registration.
			//console.log(`Registered Zone '${zoneType.id}'`);
		} catch (error) {
			console.error(`Unable to register Zone '${zoneType.id}': ${error.message}'`);
		}
	}
}
