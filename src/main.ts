import { Player, world, system } from "@minecraft/server";

//Pre load
    //Map Data
    import "MapParser/Bridge Maps/brideMaps"

//Other
import "./betterChat";
import "./Bridge/bridge";
import "./Bridge/BridgeWorld"
import "./worldEdit/mainEdit";
import "./hypixelCosmetic/particleEffects"
import "./hypixelCosmetic/cosmeticInventory"
import "./npc/npcInteract"
import "./hypixelFunctions/adminFunctions"
import "./staticScripts/Logger"
import { Logger } from "./staticScripts/Logger";
import "./customName"
import "./MapParser/loadMap"

Logger.warn("Hypixel script running!", "Hypixel")

system.runInterval(()=> {
    const players = world.getAllPlayers()
    for (const player of players){
    //    if(player.location.y < 0){player.kill()}
    }
})