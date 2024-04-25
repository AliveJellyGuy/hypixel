import { Player } from "@minecraft/server";

// Define the PlayerValues type

// Ensure that hypixelValues is initialized as an object on Player.prototype
// Extend the Player interface to include hypixelValues
declare module "@minecraft/server" {
    interface Player {
        getHypixelValue(key: keyof PlayerValueType): number;
        setHypixelValue(key: keyof PlayerValueType, value: number): void;
    }
}

// Define properties on hypixelValues object
Player.prototype.getHypixelValue = function (key: keyof PlayerValueType): number {
    if (this.getDynamicProperty(key) === undefined) {
        this.setDynamicProperty(key, 0);
    }
    return this.getDynamicProperty(key);
};

Player.prototype.setHypixelValue = function (key: keyof PlayerValueType, value: number) {
    this.setDynamicProperty(key, value);
}

export type PlayerValueType = {
    "winsCurrency";
    "lolgetrekt";
}
// Define an array containing the valid strings
export const playerValueTypeArray: (keyof PlayerValueType)[] = ["winsCurrency", "lolgetrekt"];

