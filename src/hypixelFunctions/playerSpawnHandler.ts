import { Player, world } from "@minecraft/server";
import { MapParser } from "MapParser/loadMap";
import { GlobalVars } from "globalVars";
import { Logger } from "staticScripts/Logger";
import { AwaitFunctions } from "staticScripts/awaitFunctions";

declare module "@minecraft/server" {

    interface Player {
        setSpawnFunction(func: Function): void
    }
}

Player.prototype.setSpawnFunction = function (func: Function) {
    playerSpawnFunctionMap.set(this.id, func.bind(this));
}

/**
 * playerId: Function
 */
const playerSpawnFunctionMap: Map<string, Function> = new Map();

export  const normalSpawnFunction = (player: Player) => {
    Logger.log(`Teleporting ${player.name} to spawn`, "PlayerSpawnHandler");
    player.teleport(GlobalVars.spawn);
}

for(const player of world.getPlayers()){
    player.setSpawnFunction(normalSpawnFunction.bind(null, player));
}

world.afterEvents.playerSpawn.subscribe(async (eventData) => {
    const { initialSpawn, player } = eventData;
    if (initialSpawn) {
        player.setSpawnFunction(normalSpawnFunction);
        player.teleport(GlobalVars.spawn);
        //Just in case the player somehow is still in a match
        MapParser.removePlayerFromAllMaps(player);
    }
    await AwaitFunctions.waitTicks(1);
    playerSpawnFunctionMap.get(player.id)();
})
