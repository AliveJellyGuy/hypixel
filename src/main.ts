import { Player, world, system } from "@minecraft/server";
import "./betterChat";
import "./Bridge/bridge";
import "./Bridge/BridgeWorld"
import "./worldEdit/mainEdit";
import "./hypixelCosmetic/particleEffects"
import "./hypixelCosmetic/cosmeticInventory"
import "./npc/npcInteract"
import "./hypixelFunctions/adminFunctions"

system.runInterval(()=> {
    const players = world.getAllPlayers()
    for (const player of players){
    //    if(player.location.y < 0){player.kill()}
    }
})