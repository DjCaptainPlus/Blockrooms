import { system, world } from "@minecraft/server";
import { DimensionContextRegistry } from "./classes/DimensionContextRegistry.js";
import { CellViewManager } from "./cell/CellViewManager.js";
import { GenerationDispatcher } from "./classes/GenerationDispatcher.js";
import { registerZones } from "./zones/ZoneRegistry.js";

export class BlockRooms {
	constructor() {
		this.ready = false;
		this.worldLoaded = false;

		this.CHUNK_WIDTH = 16;
		this.CELL_SIZE = this.CHUNK_WIDTH;

		this.SIMDIST_MAX_PROBES = 20;
		this.SIMDIST_PROBE_INTERVAL = 1;

		this.MAX_SIMULATION_DISTANCE = 12;
		this.MIN_SIMULATION_DISTANCE = 4;
		this.SIMULATION_DISTANCE = this.MIN_SIMULATION_DISTANCE;

		this.CELL_VIEW_UPDATE_INTERVAL = 5;
		this.CELL_VIEW_RADIUS = 10;
		this.CELL_VIEW_VERTICAL_RANGE = 1;
		this.CELL_RETENTION_MARGIN = 1;

		this.MAX_CONCURRENT_GENERATIONS = 1000;
		this.MAX_REQUESTS_PER_CYCLE = 256;
		this.MAX_DISPATCH_PER_CYCLE = 16;
		this.DISPATCH_INTERVAL_TICKS = 2;
		this.REQUEST_INTERVAL_TICKS = 1;

		this.DEFAULT_DIMENSION_SIZE = { x: 1_000_000, y: 0, z: 1_000_000 };

		/**@type {DimensionContextRegistry} */
		this.dimensionContexts = undefined;

		/**@type {CellViewManager} */
		this.viewManager = undefined;

		/**@type {GenerationDispatcher} */
		this.dispatcher = undefined;

		// Initialize BlockRooms environment.
		this._initialize();
	}

	// *************
	// ** Methods **
	// *************

	/**
	 * Sends a chat message on behalf of the BlockRooms system.
	 * @param {string} message
	 */
	message(message) {
		world.sendMessage(`[BlockRooms] ${message}`);
	}

	// ********************
	// ** Initialization **
	// ********************

	async _initialize() {
		await this._worldReady();

		this.SIMULATION_DISTANCE = await this._determineSimulationDistance();

		this.dimensionContexts = new DimensionContextRegistry();
		this.viewManager = new CellViewManager();
		this.dispatcher = new GenerationDispatcher();

		registerZones();

		this.ready = true;
		this.message("Ready.");
		this.message(`Simulation distance: ${this.SIMULATION_DISTANCE}.`);
	}

	/**
	 * Waits for the world to be ready.
	 * @returns {Promise<void>}
	 */
	async _worldReady() {
		await this._worldLoaded();
		await this._worldTicking();
	}

	/**
	 * Waits for the world to be loaded.
	 * @returns {Promise<void>}
	 */
	_worldLoaded() {
		return new Promise((resolve) => {
			const callback = () => {
				world.afterEvents.worldLoad.unsubscribe(callback);

				resolve();
			};

			world.afterEvents.worldLoad.subscribe(callback);
		});
	}

	/**
	 * Waits for the world to be ticking.
	 * @returns {Promise<void>}
	 */
	_worldTicking() {
		return new Promise((resolve, reject) => {
			const callback = async () => {
				world.afterEvents.playerSpawn.unsubscribe(callback);
				resolve();
			};

			if (world.getAllPlayers().length > 0) {
				resolve();
			} else {
				world.afterEvents.playerSpawn.subscribe(callback);
			}
		});
	}

	/**
	 * Determines the simulation distance by probing loaded chunks in the player's dimension.
	 * @returns {Promise<number>} The determined simulation distance.
	 */
	async _determineSimulationDistance() {
		let highest = 0;

		for (let i = 0; i < this.SIMDIST_MAX_PROBES; i++) {
			const result = this._probeSimulationDistance();

			if (result === this.MAX_SIMULATION_DISTANCE) {
				return result;
			}

			highest = Math.max(result, highest);

			await system.waitTicks(this.SIMDIST_PROBE_INTERVAL);
		}

		if (highest === 0) {
			this.message(`Warning: Unable to determine simulation distance. Defaulting to ${this.MIN_SIMULATION_DISTANCE}.`);
		}

		return highest;
	}

	/**
	 * Probes the simulation distance by checking loaded chunks in the player's dimension.
	 * @returns {number} Result of the probe.
	 */
	_probeSimulationDistance() {
		const allPlayers = world.getAllPlayers();

		if (allPlayers.length === 0) {
			return 0;
		}

		const player = allPlayers[0];
		const startLocation = player.location;
		const dimension = player.dimension;

		for (let probeDistance = this.MAX_SIMULATION_DISTANCE; probeDistance >= this.MIN_SIMULATION_DISTANCE; probeDistance--) {
			const testPosition = {
				x: startLocation.x + probeDistance * this.CHUNK_WIDTH,
				y: startLocation.y,
				z: startLocation.z
			};

			const isLoaded = dimension.isChunkLoaded(testPosition);

			if (isLoaded) {
				return probeDistance;
			}
		}
	}
}
