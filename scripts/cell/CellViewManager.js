import { Dimension, Player, PlayerDimensionChangeAfterEvent, PlayerLeaveAfterEvent, PlayerSpawnAfterEvent, system, world } from "@minecraft/server";
import { PlayerCellView } from "./PlayerCellView.js";
import { blockRooms } from "../main.js";
import { Cell } from "./Cell.js";

export class CellViewManager {
	constructor() {
		/**@type {Map<string, PlayerCellView>} */
		this.viewRegistry = new Map();

		/**@type {number} */
		this.updateInterval = blockRooms.CELL_VIEW_UPDATE_INTERVAL;

		/**@type {number|undefined} */
		this.loopId = undefined;

		/**@type {boolean} */
		this.isRunning = false;

		this._initialize();
	}

	// *************
	// ** Public **
	// *************

	get size() {
		return this.viewRegistry.size;
	}

	/**
	 * Gets the PlayerCellView for the given player or player ID.
	 * @param {Player|string} playerOrId
	 * @returns {PlayerCellView|undefined}
	 */
	get(playerOrId) {
		const playerId = playerOrId instanceof Player ? playerOrId.id : playerOrId;

		if (!this.viewRegistry.has(playerId)) return;

		return this.viewRegistry.get(playerId);
	}

	/**
	 * Gets all registered PlayerCellViews.
	 * @returns {PlayerCellView[]}
	 */
	getAllViews() {
		return Array.from(this.viewRegistry.values());
	}

	/**
	 * Gets all registered PlayerCellViews in the given dimension.
	 * @param {Dimension|string} dimensionOrId
	 * @returns {PlayerCellView[]}
	 */
	getAllViewsInDimension(dimensionOrId) {
		const dimensionId = typeof dimensionOrId === "string" ? dimensionOrId : dimensionOrId.id;

		if (!blockRooms.dimensionContexts.has(dimensionId)) {
			return [];
		}

		return this.getAllViews().filter((view) => view.dimension.id === dimensionId);
	}

	/**
	 * Gets all PlayerCellViews that are interested in the given cell.
	 * @param {Cell} cell
	 */
	getInterestedViews(cell) {
		const dimension = cell.dimension;
		const viewsInDimension = this.getAllViewsInDimension(dimension);

		return viewsInDimension.filter((view) => view.isInterested(cell));
	}

	// **************
	// ** Internal **
	// **************

	_initialize() {
		this._subscribePlayerSpawn();
		this._subscribePlayerDimensionChange();
		this._subscribePlayerLeave();

		const allPlayers = world.getAllPlayers();

		for (const player of allPlayers) {
			const dimension = player.dimension;
			const isManagedDimension = blockRooms.dimensionContexts.has(dimension.id);

			if (isManagedDimension) this._registerView(player, dimension);
		}
	}

	_subscribePlayerSpawn() {
		world.afterEvents.playerSpawn.subscribe((playerSpawn) => this._onPlayerSpawn(playerSpawn));
	}

	_subscribePlayerDimensionChange() {
		world.afterEvents.playerDimensionChange.subscribe((dimensionChange) => this._onPlayerDimensionChange(dimensionChange));
	}

	_subscribePlayerLeave() {
		world.afterEvents.playerLeave.subscribe((playerLeave) => this._onPlayerLeave(playerLeave));
	}

	/**
	 * Starts the update loop for all registered PlayerCellViews.
	 */
	_start() {
		this.loopId = system.runInterval(() => {
			for (const view of this.viewRegistry.values()) {
				view.update();
			}
		}, this.updateInterval);

		this.isRunning = true;
	}

	/**
	 * Stops the update loop for all registered PlayerCellViews.
	 */
	_stop() {
		if (this.loopId !== undefined) {
			system.clearRun(this.loopId);
		}

		this.isRunning = false;
		this.loopId = undefined;
	}

	/**
	 * Registers a new PlayerCellView for the given player.
	 * @param {Player} player
	 * @param {Dimension} dimension
	 */
	_registerView(player, dimension) {
		if (this.viewRegistry.has(player.id)) {
			throw new Error(`Player "${player.id}" already has a CellView.`);
		}

		const dimensionContext = blockRooms.dimensionContexts.get(dimension);

		const view = new PlayerCellView(player, dimensionContext);
		this.viewRegistry.set(player.id, view);

		if (!this.isRunning) this._start();

		blockRooms.message(`Registered CellView for player "${player.name}" in dimension "${dimension.id}". Total views: ${this.size}.`);
	}

	/**
	 * Deletes the PlayerCellView for the given player or player ID.
	 * @param {Player|string} playerOrId
	 */
	_deleteView(playerOrId) {
		const playerId = playerOrId instanceof Player ? playerOrId.id : playerOrId;

		if (!this.viewRegistry.has(playerId)) return;

		const view = this.viewRegistry.get(playerId);

		view.cleanup();
		this.viewRegistry.delete(playerId);

		if (this.isRunning && this.viewRegistry.size === 0) {
			this._stop();
		}
	}

	/**
	 * Handles the player spawn event.
	 * @param {PlayerSpawnAfterEvent} playerSpawn
	 */
	_onPlayerSpawn(playerSpawn) {
		const { initialSpawn, player } = playerSpawn;

		// We only handle the first spawn here.
		// Dimension changes resulting from player respawning are handled by DimensionChange.
		if (!initialSpawn) return;

		const dimension = player.dimension;
		const isManagedDimension = blockRooms.dimensionContexts.has(dimension.id);

		if (isManagedDimension) this._registerView(player, dimension);
	}

	/**
	 * Handles the player dimension change event.
	 * @param {PlayerDimensionChangeAfterEvent} dimensionChange
	 */
	_onPlayerDimensionChange(dimensionChange) {
		const { player, fromDimension, toDimension } = dimensionChange;

		const fromManagedDimension = blockRooms.dimensionContexts.has(fromDimension.id);
		const toManagedDimension = blockRooms.dimensionContexts.has(toDimension.id);

		if (fromManagedDimension) this._deleteView(player);

		if (toManagedDimension) this._registerView(player, toDimension);
	}

	/**
	 * Handles the player leave event.
	 * @param {PlayerLeaveAfterEvent} playerLeave
	 */
	_onPlayerLeave(playerLeave) {
		this._deleteView(playerLeave.playerId);
	}
}
