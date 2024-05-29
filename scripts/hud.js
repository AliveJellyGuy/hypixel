import { world } from '@minecraft/server';
import { GlobalVars } from './globalVars';
import { TickFunctions } from './staticScripts/tickFunctions';
import { LinkedList } from 'dataTypes/linkedList';
import { ActionFormData, ModalFormData } from '@minecraft/server-ui';
import { showHUD } from 'staticScripts/commandFunctions';
let actionbarMessages = new LinkedList();
TickFunctions.addFunction(() => tick(), 1);
let centerFiller = 0;
const tick = () => {
    for (const player of GlobalVars.players) {
        //world.sendMessage(`Showing ${player} with ${actionbarMessages.size} messages`)
        let combiendMessage = "";
        let maxLength = 0;
        actionbarMessages.forEach((actionbarMessage, index) => {
            if (!(actionbarMessage.player.name == player.name)) {
                return;
            }
            centerFiller = Math.ceil((maxLength - actionbarMessage.message.length) / 2);
            //world.sendMessage(""+maxLength + " T: " + actionbarMessages[i].message.length + " A: " + addSpace)
            for (let i = 0; i < centerFiller; i++) {
                combiendMessage = `${combiendMessage} `;
            }
            combiendMessage = `${combiendMessage}${actionbarMessage.message}\n`;
            actionbarMessage.lifetime--;
            if (actionbarMessage.lifetime < 1) {
                actionbarMessages.deleteNodeByIndex(index);
            }
        });
        player.onScreenDisplay.setActionBar(combiendMessage);
    }
};
/**
 *
 * @param {actionbarMessage} actionbarMessage
 */
export const addActionbarMessage = (actionbarMessage) => {
    actionbarMessages.append(actionbarMessage);
};
for (const player of world.getAllPlayers()) {
    world.sendMessage(`§a§lHud initalised!`);
    addActionbarMessage({ player: player, message: `§a§lHud initalised!`, lifetime: 100 });
}
export const askForConfirmation = (player, askMessage) => {
    const form = new ActionFormData();
    form.title("Confirmation");
    form.body(askMessage);
    form.button("Yes");
    form.button("No");
    return showHUD(player, form).then((res) => {
        if (res.canceled) {
            return false;
        }
        if (res.selection == 0) {
            return true;
        }
        else {
            return false;
        }
    });
};
export const choosePlayer = async (showHUDPlayer, ignoreSelf = false, playersToChooseFrom = world.getPlayers()) => {
    const choosePlayerPanel = new ActionFormData();
    choosePlayerPanel.title("Choose Player");
    choosePlayerPanel.button("Search by name");
    const playerNameArray = playersToChooseFrom.map((player) => player.name);
    for (const player of world.getPlayers()) {
        choosePlayerPanel.button(`${player.name} (aka ${player.nameTag})`);
    }
    return showHUD(showHUDPlayer, choosePlayerPanel).then((response) => {
        if (response.canceled) {
            return;
        }
        if (response.selection === 0) {
            const searchPlayerPanel = new ModalFormData();
            searchPlayerPanel.title("Search Player");
            searchPlayerPanel.textField("Name", "Enter player name");
            showHUD(showHUDPlayer, searchPlayerPanel).then((res) => {
                if (res.canceled) {
                    return;
                }
                const filteredPlayers = world.getPlayers().filter((player) => player.name === res.formValues[0]);
                if (filteredPlayers.length === 0) {
                    showHUDPlayer.sendMessage(`§cNo player found with the name ${res.formValues[0]}\nMake sure to use the name, not the nameTag/nick`);
                    return;
                }
                choosePlayer(showHUDPlayer, ignoreSelf, filteredPlayers);
            });
        }
        return playersToChooseFrom[response.selection - 1];
    });
};
