import { genregion } from "./genregion.js";
import { goto } from "./goto.js";
const registry = [genregion, goto];

/**
 * @param {import("@minecraft/server").StartupEvent} startupEvent
 */
export function registerCustomCommands(startupEvent) {
    for (const customCommand of registry) {
        try {
            startupEvent.customCommandRegistry.registerCommand(customCommand.definition, customCommand.function);

            // Log successful registration.
            console.log(`Registered Custom Command '${customCommand.definition.name}'`);
        } catch (error) {
            console.error(`Unable to register Custom Command '${customCommand.definition.name}': ${error.message}'`);
        }
    }
}
