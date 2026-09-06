import { CommandPermissionLevel, CustomCommandParamType } from "@minecraft/server";

export const genregion = {
	/**
	 * @type {import("@minecraft/server").CustomCommand}
	 */
	definition: {
		name: "blockrooms:genregion",
		description: "Requests a region be generated.",
		cheatsRequired: false,
		permissionLevel: CommandPermissionLevel.GameDirectors,
		mandatoryParameters: [],

		optionalParameters: [
			{
				type: CustomCommandParamType.Location,
				name: "location"
			}
		]
	},

	function: () => {
		return undefined;
	}
};
