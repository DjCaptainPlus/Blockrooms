import { Player, system, world } from "@minecraft/server";
import { registerCustomCommands } from "./commands/CustomCommandRegistry";
import { BlockRooms } from "./BlockRooms.js";

export const blockRooms = new BlockRooms();

system.beforeEvents.startup.subscribe((startup) => {
	registerCustomCommands(startup);
	startup.dimensionRegistry.registerCustomDimension("blockrooms:blockrooms");
});

world.afterEvents.playerDimensionChange.subscribe((dimensionChange) => {
	const { fromDimension, toDimension, player } = dimensionChange;

	world.sendMessage(`${player.name} changed from ${fromDimension.id} to ${toDimension.id}.`);
});


world.afterEvents.playerCraftRecipe.subscribe((craftRecipe) => {
	const {player, block, itemStack} = craftRecipe;

	world.sendMessage(`You have crafted a ${itemStack.localizationKey}`)


})