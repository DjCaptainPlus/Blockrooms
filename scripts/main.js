import { Player, system, world } from "@minecraft/server";
import { registerCustomCommands } from "./commands/CustomCommandRegistry";
import { BlockRooms } from "./BlockRooms.js";
import { CustomForm } from "@minecraft/server-ui";
import { Region } from "./classes/Region.js";

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

	const FILL_BLOCKS = ["minecraft:white_wool", "minecraft:black_wool"];
	const TRIGGER_BLOCK = "minecraft:stone";
	const AREA_SIZE = { x: 9, y: 1, z: 9 };

	if (block.typeId !== TRIGGER_BLOCK) return;

	const center = block.location;
	const min = {
		x: center.x - Math.floor(AREA_SIZE.x / 2),
		y: center.y,
		z: center.z - Math.floor(AREA_SIZE.z / 2)
	};

	const parent = new Region(min, AREA_SIZE);

	const regions = parent.split("x", 2, 7);

	for (let i = 0; i < regions.length; i++) {
		const fillBlock = isEven(i) ? FILL_BLOCKS[0] : FILL_BLOCKS[1];
		const region = regions[i];

		const volume = region.toVolume();

		dimension.fillBlocks(volume, fillBlock);
	}
});

function isEven(number) {
	return number % 2 === 0;
}
