import { world, ItemStack, EnchantmentTypes, EquipmentSlot } from "@minecraft/server";
const chestLocation = { x: 3, y: 57, z: -33 };
var EDyedArmorSlot;
(function (EDyedArmorSlot) {
    EDyedArmorSlot[EDyedArmorSlot["redLeatherChestplate"] = 0] = "redLeatherChestplate";
    EDyedArmorSlot[EDyedArmorSlot["blueLeatherChestplate"] = 1] = "blueLeatherChestplate";
})(EDyedArmorSlot || (EDyedArmorSlot = {}));
const overworld = world.getDimension("overworld");
const chest = overworld.getBlock(chestLocation);
const redLeatherChestplate = chest.getComponent("inventory").container.getItem(EDyedArmorSlot.redLeatherChestplate);
const players = world.getAllPlayers();
for (const player of players) {
    player.getComponent("equippable").setEquipment(EquipmentSlot.Chest, redLeatherChestplate);
}
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
            const item = chestInventory.getItem(i);
            if (item == undefined) {
                continue;
            }
            armorSlot.forEach((value, key) => {
                if (item.typeId.includes(key)) {
                    this.addItem({ item: item, slot: value, isArmor: true });
                }
            });
        }
    }
}
let iron_sword = new ItemStack("iron_sword");
let bow = new ItemStack("bow");
let diamond_pickaxe = new ItemStack("diamond_pickaxe");
let red_terracotta = new ItemStack("red_terracotta");
red_terracotta.amount = 64;
let golden_apple = new ItemStack("golden_apple");
let red_leather_boots = new ItemStack("leather_boots");
red_leather_boots;
golden_apple.amount = 8;
const eff = EnchantmentTypes.get("efficiency");
diamond_pickaxe.getComponent("enchantable").addEnchantment({ type: eff, level: 2 });
let red_kit = new Kit(chestLocation);
