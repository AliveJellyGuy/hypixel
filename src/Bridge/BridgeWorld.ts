import { Player, world, system, ItemStack, Component, GameMode } from "@minecraft/server";

interface BlockRights{
    allowedBlocks : string[],
    skylimit : number
    floorlimit : number
}

/** @type {Map<string, BlockRights>} Map(Player Tag, List of breakable blocks)*/
const breakAllowed: Map<string, BlockRights> = new Map();
breakAllowed.set("redBridge", {allowedBlocks: ["red_terracotta", "blue_terracotta", "white_terracotta", "tallgrass"], skylimit: 100, floorlimit: 83})
breakAllowed.set("blueBridge", {allowedBlocks: ["red_terracotta", "blue_terracotta", "white_terracotta", "tallgrass"], skylimit: 100, floorlimit: 83})


world.beforeEvents.playerBreakBlock.subscribe((eventdata)=>{
    const player = eventdata.player
    if(player.getGameMode()==GameMode.creative){
        return;
    }
    const breakable : Set<string> = new Set();
    const playerTags = player.getTags();
    for (const playerTag of playerTags){
        if(breakAllowed.has(playerTag)){
            for (const blockName of breakAllowed.get(playerTag).allowedBlocks){
                if(!blockName.includes(":")) {
                   breakable.add(`minecraft:${blockName}`)
                   continue;
                }
                breakable.add(blockName)
            }
        }
    }
    
    if(!breakable.has(eventdata.block.typeId)){
        eventdata.cancel = true
        system.run(async ()=>{
            player.playSound("dig.stone")
        })
        player.sendMessage("§cYou can't break this block!")
    }
    
})

world.beforeEvents.playerPlaceBlock.subscribe((eventdata)=>{
    const player = eventdata.player
    if(player.getGameMode()==GameMode.creative){
        return;
    }
    let skylimit = 0;
    let floorlimit = 0;
    const playerTags = player.getTags();
    for (const playerTag of playerTags){
        if(breakAllowed.has(playerTag)){
            skylimit = breakAllowed.get(playerTag).skylimit
            floorlimit = breakAllowed.get(playerTag).floorlimit
        }
    }
    
    if(eventdata.block.location.y>=skylimit || eventdata.block.location.y<=floorlimit){
        eventdata.cancel = true
        system.run(async ()=>{
            player.playSound("dig.stone")
        })
        player.sendMessage("§cYou can't place blocks here!")
    }
})