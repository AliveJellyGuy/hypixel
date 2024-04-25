import { ModalFormData } from "@minecraft/server-ui";
import { addCommand, showHUD } from "staticScripts/commandFunctions";
import { playerValueTypeArray } from "./playerFunctions";
addCommand({ commandName: "admin", chatFunction: ((event) => { showAdminPanel(event.sender); }), directory: "twla/lmao", commandPrefix: "!!" });
function isValidNumber(inputStr) {
    const numericRepr = parseFloat(inputStr);
    return !isNaN(numericRepr) && numericRepr.toString().length === inputStr.length;
}
const adminFunctions = [];
const showAdminPanel = (player) => {
    setPlayerValues(player, player);
};
const setPlayerValues = (showHUDPlayer, setValuesPlayer) => {
    const playerValuesPanel = new ModalFormData();
    playerValuesPanel.title("Player Values");
    for (const key of playerValueTypeArray) {
        // Iterate over the keys of IPlayerValues object
        playerValuesPanel.textField(key, String(setValuesPlayer.getHypixelValue(key)), String(setValuesPlayer.getHypixelValue(key)));
    }
    showHUD(showHUDPlayer, playerValuesPanel).then((response) => {
        if (response.canceled) {
            return;
        }
        for (let i = 0; i < response.formValues.length; i++) {
            const value = response.formValues[i];
            if (!isValidNumber(value)) {
                showHUDPlayer.sendMessage(`Expected Number! ${value}`);
                continue;
            }
            // Set the values based on the order of keys
            setValuesPlayer.setHypixelValue(playerValueTypeArray[i], Number(response.formValues[i]));
        }
    });
};
