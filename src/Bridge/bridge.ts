import { Player, world, system, ItemStack, Component, EnchantmentTypes, Vector3, Vector2, EquipmentSlot } from "@minecraft/server";
import { normalize } from "path/win32";

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

try{
    let red_kit=new Kit(redKitChestLocation)
    let blue_kit=new Kit(blueKitChestLocation)

    for(const player of players){
        red_kit.giveplayerKit(player)
        blue_kit.giveplayerKit(player)
    }   
}
catch{
    console.log("Cant find chest")
}


