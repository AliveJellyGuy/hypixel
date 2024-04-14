import { Player, world, system, ItemStack, Component, EnchantmentTypes, Vector3, Vector2, EquipmentSlot } from "@minecraft/server";
import { normalize } from "path/win32";


const chestLocation = {x: 3, y: 57, z: -33} as Vector3;

enum EDyedArmorSlot{
    redLeatherChestplate,
    blueLeatherChestplate,
}


const overworld = world.getDimension("overworld");

const chest = overworld.getBlock(chestLocation);

const redLeatherChestplate = chest.getComponent("inventory").container.getItem(EDyedArmorSlot.redLeatherChestplate);

const players = world.getAllPlayers();

for (const player of players){
    player.getComponent("equippable").setEquipment(EquipmentSlot.Chest, redLeatherChestplate)
}

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
            const item = chestInventory.getItem(i);
            if(item == undefined) {continue;}
            armorSlot.forEach((value, key) => {
                if(item.typeId.includes(key)) {
                    this.addItem({item: item, slot: value, isArmor: true})
                }
            })
        }


    }
}

let iron_sword = new ItemStack("iron_sword");
let bow = new ItemStack("bow");
let diamond_pickaxe = new ItemStack("diamond_pickaxe");
let red_terracotta = new ItemStack("red_terracotta");
red_terracotta.amount=64
let golden_apple = new ItemStack("golden_apple");
let red_leather_boots = new ItemStack("leather_boots");
red_leather_boots
golden_apple.amount=8
const eff = EnchantmentTypes.get("efficiency");
diamond_pickaxe.getComponent("enchantable").addEnchantment({type: eff, level:2})

let red_kit=new Kit(chestLocation)


