/** @typedef {typeof import("../generation/Zone.js").Zone} ZoneType */

export class ZoneTypes {
	/** @type {Map<string, ZoneType>} */
	static types = new Map();

	/**
	 * Registers a new zone type in the registry.
	 * @param {ZoneType} zoneType
	 */
	static register(zoneType) {
		this.types.set(zoneType.id, zoneType);
	}

	/**
	 * Retrieves a registered zone type by its ID.
	 * @param {string} zoneTypeId
	 * @returns {ZoneType}
	 */
	static get(zoneTypeId) {
		if (!this.types.has(zoneTypeId)) {
			throw new Error(`Zone type with ID "${zoneTypeId}" is not registered.`);
		}

		return this.types.get(zoneTypeId);
	}
}
