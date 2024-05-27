import { Container, EntityInventoryComponent, Player, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { MapParser } from "MapParser/loadMap";
import { GlobalVars } from "globalVars";
import { Logger, LoggerClass } from "staticScripts/Logger";
import { addCommand, showHUD } from "staticScripts/commandFunctions";

// Define the PlayerValues type

// Ensure that hypixelValues is initialized as an object on Player.prototype
// Extend the Player interface to include hypixelValues
declare module "@minecraft/server" {
    interface Player {
        isHoldingItem(itemName: string): boolean;
        hasItem(itemName: string): boolean;
        hasItemInHotbar(itemName: string): boolean;
    }
}

// Ensure that the methods are added to the prototype
Player.prototype.isHoldingItem = function (this: Player, itemName: string) {
    const inventory = this.getComponent("inventory").container as Container;
    if (inventory.getItem(this.selectedSlot)?.typeId.includes(itemName)) {
        return true;
    } else {
        return false;
    }
}

Player.prototype.hasItem = function (this: Player, itemName: string): boolean {
    const inventory = this.getComponent("inventory").container as Container;
    for (let i = 0; i < inventory.size; i++) {
        let item = inventory.getItem(i);
        if (!item) { continue; }
        if (item.typeId.includes(itemName)) {
            return true;
        }
    }
    return false;
}

Player.prototype.hasItemInHotbar = function (this: Player, itemName: string): boolean {
    const inventory = this.getComponent("inventory").container as Container;
    for (let i = 0; i < 9; i++) {
        let item = inventory.getItem(i);
        if (!item) { continue; }
        if (item.typeId.includes(itemName)) {
            return true;
        }
    }
    return false;
}
