import { world, system, CommandPermissionLevel, CustomCommandParamType } from "@minecraft/server";

export const goto = {
	/**
	 * @type {import("@minecraft/server").CustomCommand}
	 */
	definition: {
		name: "blockrooms:goto",
		description: "Goes to",
		cheatsRequired: false,
		permissionLevel: CommandPermissionLevel.GameDirectors,

		mandatoryParameters: [
			{
				type: CustomCommandParamType.PlayerSelector,
				name: "players"
			}
		],

		optionalParameters: [
			{
				type: CustomCommandParamType.String,
				name: "dimension"
			}
		]
	},

	/**
	 * @param {import("@minecraft/server").CustomCommandOrigin} origin
	 */
	function: (origin) => {
		system.run(() => {
			const blockRoomsDimension = world.getDimension("blockrooms:blockrooms");

			origin.sourceEntity.teleport({ x: 0, y: 0, z: 0 }, { dimension: blockRoomsDimension });
		});

		return undefined;
	}
};
