import { world } from "@minecraft/server";
export { GlobalVars };
class GlobalVars {
    static getPlayers() {
        this.players = world.getAllPlayers();
    }
}
/**
 * @type {Player[]}
 */
GlobalVars.players = world.getAllPlayers();
/**
 * @type {Dimension}
 */
GlobalVars.overworld = world.getDimension("overworld");
GlobalVars.spawn = { x: 150, y: 65, z: 5 };
