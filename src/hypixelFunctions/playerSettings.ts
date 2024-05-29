import { Player, world } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { Logger } from "staticScripts/Logger"; // Adjust the path as necessary
import { showHUD } from "staticScripts/commandFunctions";

type Settings = {
    doNotDisturb: boolean;
    exampleNumberType: number;
};

declare module "@minecraft/server" {
    export interface Player {
        setSettings(): void;
        getSetting(key: keyof Settings): string | number | boolean;
        setSetting(key: keyof Settings, value: string | number | boolean): void;
    }
}

// Initialize settings keys
const settingsKeys: (keyof Settings)[] = ["doNotDisturb", "exampleNumberType"];
const defaultSettings: Settings = {
    doNotDisturb: false,
    exampleNumberType: 0,
};

// Method to initialize default settings if they are not present
function initializeSettings(player: Player) {
    

    settingsKeys.forEach((key) => {
        if (player.getDynamicProperty(key) === undefined) {
            player.setDynamicProperty(key, defaultSettings[key]);
        }
    });
}

Player.prototype.setSettings = function () {
    const player = this as Player;
    initializeSettings(player);

    const settingsScreen = new ModalFormData();
    settingsScreen.title("Settings");

    settingsKeys.forEach((key) => {
        const currentValue = player.getSetting(key);
        if (typeof currentValue === "boolean") {
            settingsScreen.toggle(key, currentValue);
        } else if (typeof currentValue === "number") {
            settingsScreen.slider(key, 0, 100, 1, currentValue); // Adjust slider parameters as needed
        }
    });

    showHUD(player, settingsScreen).then((response) => {
        if (response.canceled) return;

        response.formValues.forEach((value, index) => {
            const key = settingsKeys[index];
            player.setSetting(key, value);
        });
    });
};

Player.prototype.getSetting = function (key: keyof Settings): string | number | boolean {
    const value = this.getDynamicProperty(key);
    if (value === undefined) {
        const defaultSettings: Settings = {
            doNotDisturb: false,
            exampleNumberType: 0,
        };
        this.setDynamicProperty(key, defaultSettings[key]);
        return defaultSettings[key];
    }
    return value;
};

Player.prototype.setSetting = function (key: keyof Settings, value: string | number | boolean): void {
    Logger.log(`Setting ${key} to ${value}`, "Settings");
    this.setDynamicProperty(key, value);
};

const setSetting = (player: Player, key: keyof Settings, value: string | number | boolean): void => {
    player.setSetting(key, value);
};

const getSetting = (player: Player, key: keyof Settings): string | number | boolean => {
    return player.getSetting(key);
};

// Example usage
for (const player of world.getPlayers()) {
   // player.setSettings();
}
