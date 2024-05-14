import { Player, world, system, ItemStack, Component, EnchantmentTypes, Vector3, Vector2, EquipmentSlot } from "@minecraft/server";
import { IMapData } from "MapParser/loadMap";
import { warn } from "console";
import { GlobalVars } from "globalVars";
import { normalize } from "path/win32";
import { Logger } from "staticScripts/Logger";
import { AwaitFunctions } from "staticScripts/awaitFunctions";
import { CollisionFunctions } from "staticScripts/collisionFunctions";

const redKitChestLocation = {x: 3, y: 57, z: -33} as Vector3;
const blueKitChestLocation = {x: 7, y: 57, z: -33} as Vector3;

const players = world.getAllPlayers();

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

class Kit{
    private items: Item[]= []

    constructor (chestLocation: Vector3){
        this.readKitFromChest(chestLocation)
    }
    private addItem(item:Item){
        this.items.push(item)
    }
    

    giveplayerKit(player:Player){
        const inventory=player.getComponent("inventory")
        const equippable = player.getComponent("equippable")
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


export const red_kit=new Kit(redKitChestLocation)
export const blue_kit=new Kit(blueKitChestLocation)

for(const player of players){
    red_kit.giveplayerKit(player)
    blue_kit.giveplayerKit(player)
}

export interface IBridgeData {
    teams: {
        teamName: string,
        teamKit: Kit,
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
export const bridgeTick = (MapData: IMapData) => {
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
                        bridgeNextRound(MapData);
                        break;
                    }
                }
            }
        }
    }
}

export const bridgeNextRound = async (MapData: IMapData) => {
    Logger.log(`Starting next round`, "Bridge")
    const bridgeData = MapData.gameModeData as IBridgeData;

    const overworld = world.getDimension("overworld");
    for(const team of bridgeData.teams) {
        for(const spawnBarriers of team.spawnBarriers) {
            overworld.fillBlocks(spawnBarriers.startPosition, spawnBarriers.endPosition, team.spawnBarrierBlockTypeID)
        }
        for(let i = 0; i < team.players.length; i++) {
            //team.teamKit.giveplayerKit(team.players[i]);
            team.players[i].teleport(team.spawnPoints[i % team.spawnPoints.length]);
        }
    }
    
    await AwaitFunctions.waitTicks(50);

    for(const team of bridgeData.teams) {
        for(const spawnBarriers of team.spawnBarriers) {
            overworld.fillBlocks(spawnBarriers.startPosition, spawnBarriers.endPosition, "air")
        }
    }

}
