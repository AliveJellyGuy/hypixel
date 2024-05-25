import { Player, world } from "@minecraft/server";
import { MapParser } from "MapParser/loadMap";
import { GlobalVars } from "globalVars";
import { Logger } from "staticScripts/Logger";
Player.prototype.setSpawnFunction = function (func) {
    playerSpawnFunctionMap.set(this.id, func.bind(this));
};
/**
 * playerId: Function
 */
const playerSpawnFunctionMap = new Map();
const normalSpawnFunction = (player) => {
    Logger.log(`Teleporting ${player.name} to spawn`, "PlayerSpawnHandler");
    player.teleport(GlobalVars.spawn);
};
for (const player of world.getPlayers()) {
    player.setSpawnFunction(normalSpawnFunction.bind(null, player));
}
world.afterEvents.playerSpawn.subscribe((eventData) => {
    const { initialSpawn, player } = eventData;
    if (initialSpawn) {
        player.setSpawnFunction(normalSpawnFunction);
        player.teleport(GlobalVars.spawn);
        //Just in case the player somehow is still in a match
        MapParser.removePlayerFromAllMaps(player);
    }
    playerSpawnFunctionMap.get(player.id)();
});
