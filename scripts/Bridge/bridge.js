import { world, EquipmentSlot } from "@minecraft/server";
import { MapParser } from "MapParser/loadMap";
import { Logger } from "staticScripts/Logger";
import { AwaitFunctions } from "staticScripts/awaitFunctions";
import { CollisionFunctions } from "staticScripts/collisionFunctions";
const players = world.getAllPlayers();
const armorSlot = new Map()
    .set("chestplate", EquipmentSlot.Chest)
    .set("leggings", EquipmentSlot.Legs)
    .set("boots", EquipmentSlot.Feet)
    .set("helmet", EquipmentSlot.Head);
export class Kit {
    constructor(chestLocation) {
        this.items = [];
        this.readKitFromChest(chestLocation);
    }
    addItem(item) {
        this.items.push(item);
    }
    giveplayerKit(player) {
        player.runCommand("clear");
        player.addEffect("regeneration", 5);
        const inventory = player.getComponent("inventory");
        const equippable = player.getComponent("equippable");
        for (const item of this.items) {
            if (item.isArmor) {
                equippable.setEquipment(item.slot, item.item);
            }
            else {
                inventory.container.setItem(item.slot, item.item);
            }
        }
    }
    readKitFromChest(chestLocation) {
        const overworld = world.getDimension("overworld");
        const chest = overworld.getBlock(chestLocation);
        const chestInventory = chest.getComponent("inventory").container;
        for (let i = 0; i < chestInventory.size; i++) {
            let equippable = false;
            const item = chestInventory.getItem(i);
            if (item == undefined) {
                continue;
            }
            armorSlot.forEach((value, key) => {
                if (item.typeId.includes(key)) {
                    this.addItem({ item: item, slot: value, isArmor: true });
                    equippable = true;
                    return;
                }
            });
            if (equippable == false) {
                this.addItem({ item: item, slot: i, isArmor: false });
            }
        }
    }
}
export const bridgeTick = async (MapData) => {
    const bridgeData = MapData.gameModeData;
    for (const team of bridgeData.teams) {
        for (const enemyTeam of bridgeData.teams) {
            if (enemyTeam.teamName == team.teamName) {
                continue;
            }
            //  Logger.warn(`Team ${team.teamName} vs ${enemyTeam.teamName} score: ${team.teamScore}`, "Bridge")
            for (const player of team.players) {
                for (const capturePoint of enemyTeam.capturePoints) {
                    //Logger.warn(`Testing for collision start ${capturePoint.startPosition} end ${capturePoint.endPosition}`, "Bridge")
                    if (CollisionFunctions.insideBox(player.location, capturePoint.startPosition, capturePoint.endPosition, true)) {
                        Logger.warn(`${player.name} captured ${enemyTeam.teamName}!`, "Bridge");
                        team.teamScore++;
                        bridgeNextRound(MapData, team.teamName + " §fcaptured " + enemyTeam.teamName);
                        break;
                    }
                }
            }
        }
    }
};
export const bridgeNextRound = async (MapData, winningMessage) => {
    Logger.log(`Starting next round`, "Bridge");
    const bridgeData = MapData.gameModeData;
    let gameEnd = false;
    let vsMessage = "";
    bridgeData.teams.forEach(element => {
        vsMessage += `§6${element.teamName}: ${element.teamScore} §fvs `;
    });
    vsMessage = vsMessage.slice(0, -3);
    vsMessage += "\n";
    const overworld = world.getDimension("overworld");
    for (const team of bridgeData.teams) {
        for (const spawnBarriers of team.spawnBarriers) {
            overworld.fillBlocks(spawnBarriers.startPosition, spawnBarriers.endPosition, team.spawnBarrierBlockTypeID);
        }
        for (let i = 0; i < team.players.length; i++) {
            new Kit(team.teamKitLocation).giveplayerKit(team.players[i]);
            team.players[i].teleport(team.spawnPoints[i % team.spawnPoints.length]);
            team.players[i].onScreenDisplay.setTitle(`§a${vsMessage}${winningMessage}`, { fadeInDuration: 0, stayDuration: 100, fadeOutDuration: 0 });
            team.players[i].playSound("random.levelup");
        }
        if (team.teamScore >= bridgeData.winsNeeded) {
            for (const player of team.players) {
                player.setHypixelValue("Wins", player.getHypixelValue("Wins") + 1);
                player.setHypixelValue("winsCurrency", player.getHypixelValue("winsCurrency") + 1);
            }
            gameEnd = true;
        }
    }
    if (gameEnd) {
        endBridgeRound(MapData);
        return;
    }
    await AwaitFunctions.waitTicks(50);
    for (const team of bridgeData.teams) {
        for (const spawnBarriers of team.spawnBarriers) {
            overworld.fillBlocks(spawnBarriers.startPosition, spawnBarriers.endPosition, "air");
        }
    }
};
const endBridgeRound = async (mapData) => {
    Logger.log(`End of round ${mapData.name} id: ${mapData.mapId}`, "Bridge");
    MapParser.unlaodMap(mapData.mapId);
};
