import { Player, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { Logger, LoggerClass } from "staticScripts/Logger";
import { addCommand, showHUD } from "staticScripts/commandFunctions";

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
    Logger.log(`Setting ${key} to ${value}`, "Hypixel");
    this.setDynamicProperty(key, value);
}

/** 
 * If the key starts with a capital Letter, it is a public statistic
 * If it doesnt, it is a private statistic
 */
export type PlayerValueType = {
    "Wins";
    "Loses";
    "Kills";
    "Highest Winstreak";
    "winsCurrency";
    "lolgetrekt";
}
// Define an array containing the valid strings
export const playerValueTypeArray: (keyof PlayerValueType)[] = ["winsCurrency", "lolgetrekt"];
export const publicStatsTypeArray: (keyof PlayerValueType)[] = ["Wins", "Loses", "Kills", "Highest Winstreak"];

const showPlayerStats = (showHUDPlayer: Player, getPlayer: Player) => {
    Logger.log(`Showing Stats to ${showHUDPlayer.name} for ${getPlayer.name}`, "Hypixel");
    const playerStatsPanel = new ActionFormData();
    playerStatsPanel.title("Player Stats");
    let joinedString = "";
    for(const key of publicStatsTypeArray) {
        joinedString += `§r${key}: §a${getPlayer.getHypixelValue(key).toString()}\n`;
    }
    playerStatsPanel.body(joinedString);
    playerStatsPanel.button("Close");
    showHUD(showHUDPlayer, playerStatsPanel)
}

addCommand({commandName: "stats", commandPrefix: ";;", directory: "hypixel", chatFunction: ((chatSendEvent) => {showPlayerStats(chatSendEvent.sender, chatSendEvent.sender)}),})