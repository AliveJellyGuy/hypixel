import { addCommand } from "staticScripts/commandFunctions";
import { choosePlayer } from "hud";
addCommand({ commandName: "partyinvite", chatFunction: ((event) => { createPartyWindow({ player: event.sender }); }), directory: "twla/lmao", commandPrefix: "!!" });
//addCommand({commandName: "partyaccept", chatFunction: ((event) => {acceptParty(event.sender);}), directory: "twla/lmao", commandPrefix: "!!"})
var parties = [];
const createPartyWindow = async (params) => {
    const sender = params.player;
    const showHUDPlayer = params.player;
    const res = await choosePlayer(params.player).then((player) => { return player; });
    invitePlayer(res, sender);
};
function invitePlayer(invitedPlayer, invitingPlayer) {
    invitedPlayer.sendMessage(invitingPlayer.name + " has invited you to a party!, type !!partyaccept to join");
}
function acceptParty(acceptingPlayer, invitingPlayer) {
}
