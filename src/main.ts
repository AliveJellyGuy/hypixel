import { Player, world, system } from "@minecraft/server";
import "./betterChat";
import "./bridge";
import "./worldEdit/mainEdit";

system.runInterval(()=> {
    const players = world.getAllPlayers()
    for (const player of players){
        if(player.location.y < 0){player.kill()}}
})