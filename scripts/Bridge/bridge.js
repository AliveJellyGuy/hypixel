import { world, EquipmentSlot } from "@minecraft/server";
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
try {
    let red_kit = new Kit(redKitChestLocation);
    let blue_kit = new Kit(blueKitChestLocation);
    for (const player of players) {
        red_kit.giveplayerKit(player);
        blue_kit.giveplayerKit(player);
    }
}
catch {
    console.log("Cant find chest");
}
