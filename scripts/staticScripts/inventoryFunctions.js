import { Player } from "@minecraft/server";
// Ensure that the methods are added to the prototype
Player.prototype.isHoldingItem = function (itemName) {
    const inventory = this.getComponent("inventory").container;
    if (inventory.getItem(this.selectedSlot)?.typeId.includes(itemName)) {
        return true;
    }
    else {
        return false;
    }
};
Player.prototype.hasItem = function (itemName) {
    const inventory = this.getComponent("inventory").container;
    for (let i = 0; i < inventory.size; i++) {
        let item = inventory.getItem(i);
        if (!item) {
            continue;
        }
        if (item.typeId.includes(itemName)) {
            return true;
        }
    }
    return false;
};
Player.prototype.hasItemInHotbar = function (itemName) {
    const inventory = this.getComponent("inventory").container;
    for (let i = 0; i < 9; i++) {
        let item = inventory.getItem(i);
        if (!item) {
            continue;
        }
        if (item.typeId.includes(itemName)) {
            return true;
        }
    }
    return false;
};
