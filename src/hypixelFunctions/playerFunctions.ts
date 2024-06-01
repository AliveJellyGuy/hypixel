import { Player, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { MapParser } from "MapParser/loadMap";
import { GlobalVars } from "globalVars";
import { Logger, LoggerClass } from "staticScripts/Logger";
import { addCommand, showHUD } from "staticScripts/commandFunctions";
import { normalSpawnFunction } from "./playerSpawnHandler";

// Define the PlayerValues type

// Ensure that hypixelValues is initialized as an object on Player.prototype
// Extend the Player interface to include hypixelValues
declare module "@minecraft/server" {
    interface Player {
        getHypixelValue(key: keyof PlayerValueType): number;
        setHypixelValue(key: keyof PlayerValueType, value: number): void;

        awardWin(): void
        awardDraw(): void
        awardLoss(): void

        sendToHub(): void

        
    }
}

// Define properties on hypixelValues object
//#region Functions
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

Player.prototype.awardWin = function () {
    Logger.warn(`Awarding Win to ${this.name} aka ${this.nameTag}`, "Hypixel");
    this.setHypixelValue("Wins", this.getHypixelValue("Wins") + 1);
    this.setHypixelValue("winsCurrency", this.getHypixelValue("winsCurrency") + 1);
    this.setHypixelValue("Current Winstreak", this.getHypixelValue("Current Winstreak") + 1);
    if(this.getHypixelValue("Current Winstreak") > this.getHypixelValue("Highest Winstreak")) {
        this.setHypixelValue("Highest Winstreak", this.getHypixelValue("Current Winstreak"));
    }
}

Player.prototype.awardDraw = function () {
    Logger.warn(`Awarding Draw to ${this.name} aka ${this.nameTag}`, "Hypixel");
    //this.setHypixelValue("Current Winstreak", 0);
}

Player.prototype.awardLoss = function () {
    Logger.warn(`Awarding Lose to ${this.name} aka ${this.nameTag}`, "Hypixel");
    this.setHypixelValue("Loses", this.getHypixelValue("Loses") + 1);
    this.setHypixelValue("Current Winstreak", 0);
}

Player.prototype.sendToHub = function () {
    const player = this as Player
    this as Player
    this.runCommand("clear")
    MapParser.removePlayerFromAllMaps(this);
    this.setSpawnFunction(normalSpawnFunction.bind(null, this));
    player.setHypixelValue("currentMatchID", -1);
    this.teleport(GlobalVars.spawn);
}
//#endregion

/** 
 * If the key starts with a capital Letter, it is a public statistic
 * If it doesnt, it is a private statistic
 */
export type PlayerValueType = {
    "Wins";
    "Loses";
    "Kills";
    "Highest Winstreak";
    "Current Winstreak";
    "winsCurrency";
    "currentMatchID";
    "currentLobbyID";
}
// Define an array containing the valid strings
export const playerValueTypeArray: (keyof PlayerValueType)[] = ["winsCurrency", "currentMatchID", "currentLobbyID"];
export const publicStatsTypeArray: (keyof PlayerValueType)[] = ["Wins", "Loses", "Kills", "Highest Winstreak", "Current Winstreak"];

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
addCommand({commandName: "hub", commandPrefix: ";;", directory: "hypixel", chatFunction: ((chatSendEvent) => {chatSendEvent.sender.sendToHub()}),})