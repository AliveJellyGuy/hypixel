import { Player, world, system, ItemStack, Component, EnchantmentTypes, Vector3, Vector2, EquipmentSlot, CompoundBlockVolume, BlockVolume, GameMode } from "@minecraft/server";
import { IMapData, MapParser } from "MapParser/loadMap";
import { Logger } from "staticScripts/Logger";
import { AwaitFunctions } from "staticScripts/awaitFunctions";
import { CollisionFunctions } from "staticScripts/collisionFunctions";


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
                    player.kill();
                }
                const playerContainer = player.getComponent("inventory").container;
                if(!(playerContainer.getItem(8))){
                    const bow = playerContainer.getItem(1);
                    const durability = bow.getComponent("durability");
                    durability.damage += 10;
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
            player.addEffect("saturation", 2000);
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
        for(const spawnBarriers of team.spawnBarriers) {
            overworld.fillBlocks(spawnBarriers.startPosition, spawnBarriers.endPosition, team.spawnBarrierBlockTypeID)
        }
        for(let i = 0; i < team.players.length; i++) {
            new Kit(team.teamKitLocation).giveplayerKit(team.players[i]);
            team.players[i].teleport(team.spawnPoints[i % team.spawnPoints.length]);
            team.players[i].onScreenDisplay.setTitle(`§a${vsMessage}${winningMessage}`, {fadeInDuration: 0, stayDuration: 100, fadeOutDuration: 0});
            team.players[i].playSound("random.levelup");
            team.players[i].addEffect("regeneration", 200);
            team.players[i].addEffect("saturation", 2000);
            team.players[i].addTag("bridge");
        }
        if(team.teamScore >= bridgeData.winsNeeded){
            for(const player of team.players){
                player.awardWin();
            }
            gameEnd = true;
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