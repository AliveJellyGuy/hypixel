import { Player, world, system, ItemStack, Component, EnchantmentTypes, Vector3, Vector2, EquipmentSlot, CompoundBlockVolume, BlockVolume, GameMode } from "@minecraft/server";
import { EGameMode, IMapData, MapParser } from "MapParser/loadMap";
import { Logger } from "staticScripts/Logger";
import { AwaitFunctions } from "staticScripts/awaitFunctions";
import { CollisionFunctions } from "staticScripts/collisionFunctions";
import { TickFunctions } from "staticScripts/tickFunctions";
import { VectorFunctions } from "staticScripts/vectorFunctions";


const players = world.getAllPlayers();

//#region Kit functions

interface Item {
    item: ItemStack, 
    slot: number | EquipmentSlot,
    isArmor?: boolean
}

const armorSlot : Map<string, EquipmentSlot> = new Map()
.set("chestplate", EquipmentSlot.Chest)
.set("leggings", EquipmentSlot.Legs)
.set("boots", EquipmentSlot.Feet)
.set("helmet", EquipmentSlot.Head)

export class Kit{
    private items: Item[]= []

    constructor (chestLocation: Vector3){
        this.readKitFromChest(chestLocation)
    }
    private addItem(item:Item){
        this.items.push(item)
    }
    

    giveplayerKit(player:Player){
        player.runCommand("clear");
        player.addEffect("regeneration", 5);
        const inventory=player.getComponent("inventory");
        const equippable = player.getComponent("equippable");
        for (const item of this.items) {
            if(item.isArmor){
                equippable.setEquipment(item.slot as EquipmentSlot, item.item)
            }
            else{
                inventory.container.setItem(item.slot as number, item.item)
            }
            
        }
    }
    private readKitFromChest(chestLocation: Vector3){       
        const overworld = world.getDimension("overworld");
        const chest = overworld.getBlock(chestLocation);
        const chestInventory = chest.getComponent("inventory").container;

        for(let i = 0; i < chestInventory.size; i++){
            let equippable = false;
            const item = chestInventory.getItem(i);
            if(item == undefined) {continue;}
            armorSlot.forEach((value, key) => {
                if(item.typeId.includes(key)) {
                    this.addItem({item: item, slot: value, isArmor: true})
                    equippable = true;
                    return;
                }
            })
            if(equippable == false){
                this.addItem({item: item, slot: i, isArmor: false})
            }
        }

    }
}


//#endregion

export interface IBridgeData {
    winsNeeded: number,
    blockPlaceArea: {
        start: Vector3,
        end: Vector3
    }
    teams: {
        teamName: string,
        teamKitLocation: Vector3,
        teamScore: number,
        playerAmount: number,
        players: Player[],
        spawnPoints: Vector3[]
        capturePoints: {
            startPosition: Vector3,
            endPosition: Vector3
        }[],

        spawnBarrierBlockTypeID: string,
        spawnBarriers: {
            startPosition: Vector3,
            endPosition: Vector3
        } []
    }[]
}

//#region Bridge gamemode functions

export const bridgeStart = async (mapData: IMapData, offset: Vector3) => {
    const bridgeData = mapData.gameModeData as IBridgeData;
    let currentPlayerIndex = 0;

    bridgeData.blockPlaceArea.start = VectorFunctions.addVector(bridgeData.blockPlaceArea.start, offset);
    bridgeData.blockPlaceArea.end = VectorFunctions.addVector(bridgeData.blockPlaceArea.end, offset);

    for(const team of bridgeData.teams) {
        for(let i = 0; i < team.playerAmount; i++) {
            if(currentPlayerIndex >= players.length) {
                break;
            }
            const player = players[currentPlayerIndex];
            currentPlayerIndex++;
            team.players.push(player);
            
        } 

        //Add offset to capture points
        for(const capturePoint of team.capturePoints) {
            capturePoint.startPosition = VectorFunctions.addVector(capturePoint.startPosition, offset);
            capturePoint.endPosition = VectorFunctions.addVector(capturePoint.endPosition, offset);
        }

        //Add offset to spawn barriers
        for(const spawnBarrier of team.spawnBarriers) {
            spawnBarrier.startPosition = VectorFunctions.addVector(spawnBarrier.startPosition, offset);
            spawnBarrier.endPosition = VectorFunctions.addVector(spawnBarrier.endPosition, offset);
        }

        //Add offset to spawn points
        // Add offset to spawn points
        for (let i = 0; i < team.spawnPoints.length; i++) {
            team.spawnPoints[i] = VectorFunctions.addVector(team.spawnPoints[i], offset);
        }
    }

    mapData.tickFunctionId = TickFunctions.addFunction(bridgeTick.bind(this, mapData), 5)
    bridgeNextRound(mapData, "Round start!")
}

export const bridgeTick = async (MapData: IMapData) => {
    const bridgeData = MapData.gameModeData as IBridgeData;
    
    for(const team of bridgeData.teams){
        for(const enemyTeam of bridgeData.teams){
            if(enemyTeam.teamName == team.teamName) {continue;}
            
          //  Logger.warn(`Team ${team.teamName} vs ${enemyTeam.teamName} score: ${team.teamScore}`, "Bridge")
            for(const player of team.players){
                for(const capturePoint of enemyTeam.capturePoints){
                    //Logger.warn(`Testing for collision start ${capturePoint.startPosition} end ${capturePoint.endPosition}`, "Bridge")
                    if(CollisionFunctions.insideBox(player.location, capturePoint.startPosition, capturePoint.endPosition, true)){
                        Logger.warn(`${player.name} captured ${enemyTeam.teamName}!`, "Bridge")
                        team.teamScore++;
                        bridgeNextRound(MapData, team.teamName + " §fcaptured " + enemyTeam.teamName);
                        break;
                    }
                }
                if(player.location.y < MapData.startLocation.y - 10){
                    player.teleport(team.spawnPoints[Math.floor(Math.random() * team.spawnPoints.length)]);
                    player.addEffect("instant_health", 20);
                    new Kit(team.teamKitLocation).giveplayerKit(player);
                }
                const playerContainer = player.getComponent("inventory").container;
                if(!(player.hasItem("arrow"))){
                    let bowSlot = 0;
                    let bow : ItemStack = null;
                    for(bowSlot = 0; bowSlot < 8; bowSlot++){
                        let currentItem = playerContainer.getItem(bowSlot);
                        if(!currentItem) {continue;}
                        if(currentItem.typeId.includes("bow")){
                            bow = currentItem
                            break;
                        }

                    }
                    if(bow == null) {
                        player.sendMessage("§dAyo where did you put your bow")
                        continue;
                    }
                    if(bow.hasComponent("durability") == false){continue;}
                    const durability = bow.getComponent("durability");
                    durability.damage += 15;
                    if(durability.maxDurability - durability.damage - 10 <= 0){
                        durability.damage = 0;
                        playerContainer.setItem(8, new ItemStack("minecraft:arrow"));
                    }
                    playerContainer.setItem(1, bow);
                }
            }
        }
    }
}

export const bridgeSpawnOld = async (mapData: IMapData, player: Player) => {
    player.setGameMode(GameMode.spectator)
    const bridgeData = mapData.gameModeData as IBridgeData;
    let randomPlayer = mapData.players[Math.floor(Math.random() * mapData.players.length)];
    let attempts = 0;
    while(randomPlayer.id == player.id){
        randomPlayer = mapData.players[Math.floor(Math.random() * mapData.players.length)];
        attempts++;
        if(attempts > 10) {
            player.sendMessage(`§dCould not find a player to spectate!`);
            break;
        }
    }
    if(attempts > 10) {
        player.teleport(mapData.startLocation);
    }
    else{
        player.teleport(randomPlayer.location);
    }

    
    await AwaitFunctions.waitTicks(60);
    player.setGameMode(GameMode.survival)
    for(const team of bridgeData.teams){
        if(team.players.includes(player)){
            player.teleport(team.spawnPoints[Math.floor(Math.random() * team.spawnPoints.length)]);
        }
    }
    
    
}

export const bridgeSpawn = async (mapData: IMapData, player: Player) => {
    player.setGameMode(GameMode.spectator)
    const bridgeData = mapData.gameModeData as IBridgeData;
    player.setGameMode(GameMode.survival)
    for(const team of bridgeData.teams){
        if(team.players.includes(player)){
            player.teleport(team.spawnPoints[Math.floor(Math.random() * team.spawnPoints.length)]);
            player.addEffect("regeneration", 200);
            player.addEffect("instant_health", 20);
            player.addEffect("saturation", 2000, {showParticles: false});
            new Kit(team.teamKitLocation).giveplayerKit(player);
        }
    }
    
    
}
export const bridgeNextRound = async (MapData: IMapData, winningMessage: string) => {
    Logger.log(`Starting next round`, "Bridge")
    
    const bridgeData = MapData.gameModeData as IBridgeData;

    let gameEnd = false;

    let vsMessage = "" 
    bridgeData.teams.forEach(element => {
        vsMessage += `§6${element.teamName}: ${element.teamScore} §fvs `    
    });
    vsMessage = vsMessage.slice(0, -3);
    vsMessage += "\n"

    const overworld = world.getDimension("overworld");
    for(const team of bridgeData.teams) {
        if(team.teamScore >= bridgeData.winsNeeded){
            for(const player of team.players){
                player.awardWin();
            }
            for(const enemyTeam of bridgeData.teams){
                if(enemyTeam.teamName != team.teamName){
                    for(const player of enemyTeam.players){
                        player.awardLoss();
                    }
                }
            }
            gameEnd = true;
            break;
        }

        for(const spawnBarriers of team.spawnBarriers) {
            overworld.fillBlocks(spawnBarriers.startPosition, spawnBarriers.endPosition, team.spawnBarrierBlockTypeID)
        }
        for(let i = 0; i < team.players.length; i++) {
            new Kit(team.teamKitLocation).giveplayerKit(team.players[i]);
            team.players[i].teleport(team.spawnPoints[i % team.spawnPoints.length]);
            team.players[i].onScreenDisplay.setTitle(`§a${vsMessage}${winningMessage}`, {fadeInDuration: 0, stayDuration: 100, fadeOutDuration: 0});
            team.players[i].playSound("random.levelup");
            team.players[i].addEffect("regeneration", 200);
            team.players[i].addEffect("instant_health", 70);
            team.players[i].addEffect("saturation", 2000, {showParticles: false});
            team.players[i].addTag("bridge");
        }
        
    }

    if(gameEnd) {
        endBridgeRound(MapData);
        return;
    }
    
    await AwaitFunctions.waitTicks(50);

    for(const team of bridgeData.teams) {
        for(const spawnBarriers of team.spawnBarriers) {
            overworld.fillBlocks(spawnBarriers.startPosition, spawnBarriers.endPosition, "air")
        }
    }

}

const endBridgeRound = async (mapData: IMapData) => {
    Logger.log(`End of round ${mapData.name} id: ${mapData.mapId}`, "Bridge")
    for(const player of mapData.players){
        player.removeTag("bridge");
    }
    MapParser.unlaodMap(mapData.mapId);
}

//#endregion

//#region Bridge gamemode events

world.afterEvents.itemCompleteUse.subscribe((eventData) => {
    const item = eventData.itemStack;
    const player = eventData.source;
    if(player.hasTag("bridge")){
        if(item.typeId.includes("golden_apple")){
            player.addEffect("instant_health", 10);
            player.removeEffect("regeneration");
            player.removeEffect("absorption");
            player.addEffect("absorption", 2400, {showParticles: false});
            world.sendMessage("GAPPLE")
        }
    }

})

world.beforeEvents.playerPlaceBlock.subscribe((eventData) => {
    const player = eventData.player;
    const block = eventData.block;
    if(player.hasTag("bridge")){
        const mapData = MapParser.currentMaps.get(player.getHypixelValue("currentMatchID"));
        if(mapData.gameMode != EGameMode.BRIDGE){
            Logger.warn(`${player.name} has bridge tag but isn't in a bridge gamemode`, "Bridge")
            return;
        }
        const bridgeData = mapData.gameModeData as IBridgeData;
        if(!CollisionFunctions.insideBox(block.location, bridgeData.blockPlaceArea.start, bridgeData.blockPlaceArea.end)){
            player.sendMessage(`§cYou can't place blocks here!`);
            eventData.cancel = true;
        }

    }
})

//#endregion