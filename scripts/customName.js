import { world } from '@minecraft/server';
import { addCommand, showHUD } from 'staticScripts/commandFunctions';
import { ModalFormData } from '@minecraft/server-ui';
import { Logger } from 'staticScripts/Logger';
const playernamedynamicproperty = "nickname";
export const switchNamehud = (showHUDPlayer, changenameplayer) => {
    const playerHud = new ModalFormData();
    playerHud.title("Change the name of the player");
    playerHud.textField("newname", `${changenameplayer.nameTag}`, `${changenameplayer.name}`);
    showHUD(showHUDPlayer, playerHud).then((result) => {
        if (result.canceled) {
            return;
        }
        const newname = result.formValues[0];
        changenameplayer.nameTag = newname;
        changenameplayer.setDynamicProperty(playernamedynamicproperty, newname);
        Logger.log(`change name for our player ${changenameplayer.name} to ${result.formValues[0]}`);
    });
};
addCommand({ commandName: "nick", commandPrefix: ";;", permissions: ["vip"], directory: "changename", chatFunction: (chatSendEvent) => {
        switchNamehud(chatSendEvent.sender, chatSendEvent.sender);
    }, });
world.afterEvents.playerSpawn.subscribe((eventData) => {
    const player = eventData.player;
    const result = player.getDynamicProperty(playernamedynamicproperty);
    if (result == undefined) {
        return;
    }
    player.nameTag = result;
});
