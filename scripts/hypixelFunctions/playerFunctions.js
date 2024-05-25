import { Player } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { Logger } from "staticScripts/Logger";
import { addCommand, showHUD } from "staticScripts/commandFunctions";
// Define properties on hypixelValues object
Player.prototype.getHypixelValue = function (key) {
    if (this.getDynamicProperty(key) === undefined) {
        this.setDynamicProperty(key, 0);
    }
    return this.getDynamicProperty(key);
};
Player.prototype.setHypixelValue = function (key, value) {
    Logger.log(`Setting ${key} to ${value}`, "Hypixel");
    this.setDynamicProperty(key, value);
};
Player.prototype.awardWin = function () {
    Logger.warn(`Awarding Win to ${this.name} aka ${this.nameTag}`, "Hypixel");
    this.setHypixelValue("Wins", this.getHypixelValue("Wins") + 1);
    this.setHypixelValue("winsCurrency", this.getHypixelValue("winsCurrency") + 1);
    this.setHypixelValue("Current Winstreak", this.getHypixelValue("Current Winstreak") + 1);
    if (this.getHypixelValue("Current Winstreak") > this.getHypixelValue("Highest Winstreak")) {
        this.setHypixelValue("Highest Winstreak", this.getHypixelValue("Current Winstreak"));
    }
};
// Define an array containing the valid strings
export const playerValueTypeArray = ["winsCurrency"];
export const publicStatsTypeArray = ["Wins", "Loses", "Kills", "Highest Winstreak", "Current Winstreak"];
const showPlayerStats = (showHUDPlayer, getPlayer) => {
    Logger.log(`Showing Stats to ${showHUDPlayer.name} for ${getPlayer.name}`, "Hypixel");
    const playerStatsPanel = new ActionFormData();
    playerStatsPanel.title("Player Stats");
    let joinedString = "";
    for (const key of publicStatsTypeArray) {
        joinedString += `§r${key}: §a${getPlayer.getHypixelValue(key).toString()}\n`;
    }
    playerStatsPanel.body(joinedString);
    playerStatsPanel.button("Close");
    showHUD(showHUDPlayer, playerStatsPanel);
};
addCommand({ commandName: "stats", commandPrefix: ";;", directory: "hypixel", chatFunction: ((chatSendEvent) => { showPlayerStats(chatSendEvent.sender, chatSendEvent.sender); }), });
