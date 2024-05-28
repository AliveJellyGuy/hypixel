import { Player, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { addCommand, showHUD } from "staticScripts/commandFunctions";

addCommand({commandName: "party", chatFunction: ((event) => {createPartyWindow(event.sender)}), directory: "twla/lmao", commandPrefix: "!!"})

const createPartyWindow = (player: Player) => {
    const partyWindow = new ModalFormData()
    partyWindow.title("Invite a player!")
    



}