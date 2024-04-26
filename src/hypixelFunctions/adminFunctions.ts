import { Player } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { addCommand, showHUD } from "staticScripts/commandFunctions";
import { PlayerValueType, playerValueTypeArray } from "./playerFunctions";
import { cosmeticList } from "hypixelCosmetic/cosmeticList";
import { unlockAllCosmetics, unlockCosmetic } from "hypixelCosmetic/cosmeticInventory";
import { askForConfirmation } from "hud";

addCommand({commandName: "admin", chatFunction: ((event) => {showAdminPanel(event.sender)}), directory: "twla/lmao", commandPrefix: "!!"})

function isValidNumber(inputStr: string): boolean {
    const numericRepr = parseFloat(inputStr);
    return !isNaN(numericRepr) && numericRepr.toString().length === inputStr.length;
}

const adminFunctions = []
const showAdminPanel = (player: Player) => {
    setPlayerValues(player, player)
}

const setPlayerValues = (showHUDPlayer: Player, setValuesPlayer: Player) => {
    const playerValuesPanel = new ModalFormData();
    playerValuesPanel.title("Player Values");

    for (const key of playerValueTypeArray) {
        // Iterate over the keys of IPlayerValues object
        playerValuesPanel.textField(key, String(setValuesPlayer.getHypixelValue(key)), String(setValuesPlayer.getHypixelValue(key)));
    }
    showHUD(showHUDPlayer, playerValuesPanel).then((response) => {
        if(response.canceled) {return}
        for (let i = 0; i < response.formValues.length; i++) {
            const value = response.formValues[i];
            if(!isValidNumber(value as string)) {
                showHUDPlayer.sendMessage(`Expected Number! ${value}`)    
                continue
            }
            // Set the values based on the order of keys
            setValuesPlayer.setHypixelValue(playerValueTypeArray[i] , Number(response.formValues[i]));
        }
    })
};

addCommand({commandName: "unlock", chatFunction: ((event) => {unlockPlayerCosmetic(event.sender, event.sender)}), directory: "twla/lmao", commandPrefix: "!!"})

const unlockPlayerCosmetic =(showHUDPlayer: Player, unlockPlayer: Player) => {
    const unlockCosmeticsPanel = new ActionFormData();
    unlockCosmeticsPanel.title("Unlock Cosmetics");
    unlockCosmeticsPanel.button("All");
    for(const cosmetic of cosmeticList){
        unlockCosmeticsPanel.button(cosmetic.cosmeticId);
    }

    showHUD(showHUDPlayer, unlockCosmeticsPanel).then((response) => {
        if(response.canceled) {return}
        if(response.selection === 0) {
            if(askForConfirmation(unlockPlayer, "Are you sure you want to unlock all cosmetics?").then((res) => {return res})) {
                unlockAllCosmetics(unlockPlayer)
            }
            return;
        } else {
            unlockCosmetic(unlockPlayer, cosmeticList[response.selection - 1].cosmeticId);
        }

    })
}
