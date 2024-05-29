import { Player, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { Logger } from "staticScripts/Logger"; // Adjust the path as necessary
import { showHUD } from "staticScripts/commandFunctions";
// Initialize settings keys
const settingsKeys = ["doNotDisturb", "exampleNumberType"];
const defaultSettings = {
    doNotDisturb: false,
    exampleNumberType: 0,
};
// Method to initialize default settings if they are not present
function initializeSettings(player) {
    settingsKeys.forEach((key) => {
        if (player.getDynamicProperty(key) === undefined) {
            player.setDynamicProperty(key, defaultSettings[key]);
        }
    });
}
Player.prototype.setSettings = function () {
    const player = this;
    initializeSettings(player);
    const settingsScreen = new ModalFormData();
    settingsScreen.title("Settings");
    settingsKeys.forEach((key) => {
        const currentValue = player.getSetting(key);
        if (typeof currentValue === "boolean") {
            settingsScreen.toggle(key, currentValue);
        }
        else if (typeof currentValue === "number") {
            settingsScreen.slider(key, 0, 100, 1, currentValue); // Adjust slider parameters as needed
        }
    });
    showHUD(player, settingsScreen).then((response) => {
        if (response.canceled)
            return;
        response.formValues.forEach((value, index) => {
            const key = settingsKeys[index];
            player.setSetting(key, value);
        });
    });
};
Player.prototype.getSetting = function (key) {
    const value = this.getDynamicProperty(key);
    if (value === undefined) {
        const defaultSettings = {
            doNotDisturb: false,
            exampleNumberType: 0,
        };
        this.setDynamicProperty(key, defaultSettings[key]);
        return defaultSettings[key];
    }
    return value;
};
Player.prototype.setSetting = function (key, value) {
    Logger.log(`Setting ${key} to ${value}`, "Settings");
    this.setDynamicProperty(key, value);
};
const setSetting = (player, key, value) => {
    player.setSetting(key, value);
};
const getSetting = (player, key) => {
    return player.getSetting(key);
};
// Example usage
for (const player of world.getPlayers()) {
    // player.setSettings();
}
