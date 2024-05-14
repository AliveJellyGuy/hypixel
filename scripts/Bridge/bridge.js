import { world, EquipmentSlot } from "@minecraft/server";
import { Logger } from "staticScripts/Logger";
import { AwaitFunctions } from "staticScripts/awaitFunctions";
import { CollisionFunctions } from "staticScripts/collisionFunctions";
const redKitChestLocation = { x: 3, y: 57, z: -33 };
const blueKitChestLocation = { x: 7, y: 57, z: -33 };
const players = world.getAllPlayers();
const armorSlot = new Map()
    .set("chestplate", EquipmentSlot.Chest)
    .set("leggings", EquipmentSlot.Legs)
    .set("boots", EquipmentSlot.Feet)
    .set("helmet", EquipmentSlot.Head);
class Kit {
    constructor(chestLocation) {
        this.items = [];
        this.readKitFromChest(chestLocation);
    }
    addItem(item) {
        this.items.push(item);
    }
    giveplayerKit(player) {
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
export const red_kit = new Kit(redKitChestLocation);
export const blue_kit = new Kit(blueKitChestLocation);
for (const player of players) {
    red_kit.giveplayerKit(player);
    blue_kit.giveplayerKit(player);
}
export const bridgeTick = (MapData) => {
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
                        bridgeNextRound(MapData);
                        break;
                    }
                }
            }
        }
    }
};
export const bridgeNextRound = async (MapData) => {
    Logger.log(`Starting next round`, "Bridge");
    const bridgeData = MapData.gameModeData;
    const overworld = world.getDimension("overworld");
    for (const team of bridgeData.teams) {
        for (const spawnBarriers of team.spawnBarriers) {
            overworld.fillBlocks(spawnBarriers.startPosition, spawnBarriers.endPosition, team.spawnBarrierBlockTypeID);
        }
        for (let i = 0; i < team.players.length; i++) {
            //team.teamKit.giveplayerKit(team.players[i]);
            team.players[i].teleport(team.spawnPoints[i % team.spawnPoints.length]);
        }
    }
    await AwaitFunctions.waitTicks(50);
    for (const team of bridgeData.teams) {
        for (const spawnBarriers of team.spawnBarriers) {
            overworld.fillBlocks(spawnBarriers.startPosition, spawnBarriers.endPosition, "air");
        }
    }
};
