/** @typedef {typeof import("../generation/Zone.js").Zone} ZoneType */
/** @typedef {import("../generation/Zone.js").Zone} Zone */
/** @typedef {import("../classes/Region.js").Region} Region */
/** @typedef {import("../classes/DimensionContext.js").DimensionContext} DimensionContext */

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

	static getAll() {
		return Array.from(this.types.values());
	}

	/**
	 * Creates a new instance of a registered zone type.
	 * @param {string} zoneTypeId
	 * @param {DimensionContext} dimensionContext
	 * @param {Region} region
	 * @param {Zone} [parentZone]
	 * @returns
	 */
	static create(zoneTypeId, dimensionContext, region, parentZone) {
		const ZoneClass = this.get(zoneTypeId);
		return new ZoneClass(dimensionContext, region, parentZone);
	}
}
