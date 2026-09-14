import { BlockTypes, Player, system, world } from "@minecraft/server";
import { registerCustomCommands } from "./commands/CustomCommandRegistry";
import { BlockRooms } from "./BlockRooms.js";
import { CustomForm } from "@minecraft/server-ui";
import { Region } from "./classes/Region.js";
import { ZoneTypes } from "./zones/ZoneTypes.js";
import { Axis } from "./types/Axis.js";

export const blockRooms = new BlockRooms();

system.beforeEvents.startup.subscribe((startup) => {
	registerCustomCommands(startup);
	startup.dimensionRegistry.registerCustomDimension("blockrooms:blockrooms");
});

world.afterEvents.playerDimensionChange.subscribe((dimensionChange) => {
	const { fromDimension, toDimension, player } = dimensionChange;

	world.sendMessage(`${player.name} changed from ${fromDimension.id} to ${toDimension.id}.`);
});

world.afterEvents.playerPlaceBlock.subscribe((blockPlace) => {
	const { block, dimension, player } = blockPlace;

	const dimensionContext = blockRooms.dimensionContexts.get(dimension);

	const TRIGGER_BLOCK = "minecraft:stone";
	const AREA_SIZE = { x: 8, y: 1, z: 44 };
	const GAP = 1;

	if (block.typeId !== TRIGGER_BLOCK) return;

	const center = block.location;
	const min = { x: center.x - Math.floor(AREA_SIZE.x / 2), y: center.y, z: center.z - Math.floor(AREA_SIZE.z / 2) };

	const splitAxis = Axis.z;
	const knownAxis = Axis.other(splitAxis);

	const parent = new Region(min, AREA_SIZE);
	const availableLength = AREA_SIZE[splitAxis] - GAP;

	const zoneTypeA = ZoneTypes.get("red_zone");
	const zoneTypeB = ZoneTypes.get("yellow_zone");

	const zoneARange = zoneTypeA.getLengthRange(parent, splitAxis, GAP);
	const zoneBRange = zoneTypeB.getLengthRange(parent, splitAxis, GAP);

	if (!zoneARange || !zoneBRange) {
		blockRooms.message(`No valid length range for ${zoneTypeA.id} or ${zoneTypeB.id}.`);
		return;
	}

	const splitMax = Math.min(zoneARange.max, availableLength - zoneBRange.minLength);
	const splitMin = Math.max(zoneARange.minLength, availableLength - zoneBRange.max);

	blockRooms.message(`Split range for ${zoneTypeA.id} and ${zoneTypeB.id}:\n ${splitMin} - ${splitMax}`);

	if (splitMin > splitMax) {
		blockRooms.message("No valid split found.");
		return;
	}

	const split = Math.floor(Math.random() * (splitMax - splitMin + 1) + splitMin);

	const [regionA, gap, regionB] = parent.split(splitAxis, split, split + GAP);

	const zoneA = new zoneTypeA(dimensionContext, regionA);
	const zoneB = new zoneTypeB(dimensionContext, regionB);

	dimension.fillBlocks(zoneA.region.toVolume(), "minecraft:red_wool");
	dimension.fillBlocks(zoneB.region.toVolume(), "minecraft:yellow_wool");
});

function isEven(number) {
	return number % 2 === 0;
}

const pool = [
	{
		value: "an emerald",
		weight: 4
	},
	{
		value: "a diamond",
		weight: 1
	},
	{
		value: "some redstone",
		weight: 7
	},
	{
		value: "a block of dirt",
		weight: 18
	}
];

world.afterEvents.buttonPush.subscribe((buttonPush) => {
	const { block, dimension, source } = buttonPush;

	/**@type {Player} */
	const player = source;

	const reward = getReward();

	player.sendMessage(`You got §6${reward}!`);
});

function getReward() {
	let range = 0;
	pool.forEach((element) => (range += element.weight));

	let rand = Math.random() * range;

	for (const item of pool) {
		if (rand < item.weight) {
			return item.value;
		}

		rand -= item.weight;
	}
}
