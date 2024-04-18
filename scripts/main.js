import { world, system } from "@minecraft/server";
import "./betterChat";
import "./Bridge/bridge";
import "./Bridge/BridgeWorld";
import "./worldEdit/mainEdit";
import "./hypixelCosmetic/particleEffects";
import "./hypixelCosmetic/cosmeticInventory";
import "./npc/npcInteract";
system.runInterval(() => {
    const players = world.getAllPlayers();
    for (const player of players) {
        //    if(player.location.y < 0){player.kill()}
    }
});
