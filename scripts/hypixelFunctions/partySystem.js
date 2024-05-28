import { ModalFormData } from "@minecraft/server-ui";
import { addCommand, showHUD } from "staticScripts/commandFunctions";
addCommand({ commandName: "party", chatFunction: ((event) => { createPartyWindow(event.sender); }), directory: "twla/lmao", commandPrefix: "!!" });
const createPartyWindow = (player) => {
    const partyWindow = new ModalFormData();
    partyWindow.title("Invite a player!");
    partyWindow.toggle("Did you forget to show it coder lol?");
    showHUD(player, partyWindow).then((res) => {
        const response = res;
    });
};
