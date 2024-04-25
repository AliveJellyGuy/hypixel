import { Player } from "@minecraft/server";
// Define properties on hypixelValues object
Player.prototype.getHypixelValue = function (key) {
    if (this.getDynamicProperty(key) === undefined) {
        this.setDynamicProperty(key, 0);
    }
    return this.getDynamicProperty(key);
};
Player.prototype.setHypixelValue = function (key, value) {
    this.setDynamicProperty(key, value);
};
// Define an array containing the valid strings
export const playerValueTypeArray = ["winsCurrency", "lolgetrekt"];
