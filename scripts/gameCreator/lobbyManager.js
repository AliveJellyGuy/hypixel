import { ActionFormData } from "@minecraft/server-ui";
import { MapParser } from "MapParser/loadMap";
import { mapList } from "MapParser/mapList";
import { LinkedList } from "dataTypes/linkedList";
import { askForConfirmation, choosePlayer } from "hud";
import { addCommand, showHUD } from "staticScripts/commandFunctions";
const lobbys = new LinkedList();
const mapSelector = async (showHudPlayer) => {
    const mapSelectHud = new ActionFormData();
    mapSelectHud.title("Map Selector");
    for (const map of mapList) {
        mapSelectHud.button(map.mapName);
    }
    const selectedMap = await showHUD(showHudPlayer, mapSelectHud).then((res) => {
        return mapList[res.selection];
    });
    return selectedMap;
};
//#region Map Selector
//#endregion
const createLobby = async (hostPlayer, otherPlayers) => {
    let findID = 0;
    while (lobbys.some(lobby => lobby.lobbyId === findID)) {
        findID++;
    }
    const lobbyData = {
        selectedMap: await mapSelector(hostPlayer),
        lobbyId: findID,
        hostPlayer: hostPlayer,
        otherPlayers: otherPlayers
    };
    lobbys.append(lobbyData);
    //#region Lobby main screen
    createLobbyMainScreen(lobbyData);
};
addCommand({ commandName: "createLobby", chatFunction: ((event) => { createLobby(event.sender, []); }), directory: "twla/lmao", commandPrefix: ";;" });
const createLobbyMainScreen = async (lobbyData) => {
    let lobbyClosed = false;
    const lobbyMainScreen = new ActionFormData();
    lobbyMainScreen.title("Lobby Main Screen");
    lobbyMainScreen.body("Current Map: " + lobbyData.selectedMap.mapName);
    lobbyMainScreen.button("Close Lobby");
    lobbyMainScreen.button("Start Game");
    lobbyMainScreen.button("Refresh Player List");
    lobbyMainScreen.button("Invite Players");
    lobbyMainScreen.button("Change Map");
    lobbyMainScreen.button("Custom Settings");
    for (const player of lobbyData.otherPlayers) {
        lobbyMainScreen.button(player.name);
    }
    await showHUD(lobbyData.hostPlayer, lobbyMainScreen).then(async (res) => {
        if (res.canceled) {
            return;
        }
        switch (res.selection) {
            case 0:
                lobbys.deleteNodeByValue(lobbyData);
                lobbyClosed = true;
                return;
            case 1:
                MapParser.loadMap(lobbyData.selectedMap.mapData, { x: 200, y: 50, z: 100 }, [lobbyData.hostPlayer, ...lobbyData.otherPlayers]);
                lobbys.deleteNodeByValue(lobbyData);
                lobbyClosed = true;
                return;
            case 2:
                return;
            case 3:
                await inviteToLobby(lobbyData, lobbyData.hostPlayer);
                return;
            case 4:
                lobbyData.selectedMap = await mapSelector(lobbyData.hostPlayer);
                return;
            default:
                playerInLobbyOperations(lobbyData, res.selection - 5);
        }
    });
    if (lobbyClosed) {
        return;
    }
    createLobbyMainScreen(lobbyData);
};
const inviteToLobby = async (lobbyData, inviteSender) => {
    const playerToInvite = await choosePlayer(inviteSender);
    if (playerToInvite.getSetting("doNotDisturb")) {
        playerToInvite.sendMessage(`§c${lobbyData.hostPlayer.name} tried to invite you, but you are on do not disturb.`);
        const failMessage = new ActionFormData();
        failMessage.title("Invite Failed");
        failMessage.body("This player is on do not disturb.");
        failMessage.button("Ok");
        await showHUD(inviteSender, failMessage);
        createLobbyMainScreen(lobbyData);
        return;
    }
    //askForConfirmation(playerToInvite, "Do you want to invite " + playerToInvite.name + " to the lobby?").then((res) => {
    //    if(res) {
    //        
    //    }
    //})
    askForConfirmation(playerToInvite, `Join lobby from ${lobbyData.hostPlayer.name}?`).then((res) => {
        if (!res) {
            askForConfirmation(playerToInvite, `Turn on do not disturb?`).then((res) => {
                if (res) {
                    playerToInvite.setSetting("doNotDisturb", true);
                }
            });
            return;
        }
        lobbyData.otherPlayers.push(playerToInvite);
        inviteSender.sendMessage(`§a${playerToInvite.name} joined the lobby.`);
    });
    createLobbyMainScreen(lobbyData);
};
const playerInLobbyOperations = async (lobbyData, playerIndex) => {
    const player = lobbyData.otherPlayers[playerIndex];
    const playerOperations = new ActionFormData();
    playerOperations.title("Player Operations");
    playerOperations.body(`Player: ${player.name} aka. ${player.nameTag}`);
    playerOperations.button("Kick Player");
    await showHUD(player, playerOperations).then((res) => {
        if (res.canceled) {
            return;
        }
        switch (res.selection) {
            case 0:
                lobbyData.otherPlayers.splice(playerIndex, 1);
                return;
        }
    });
    createLobbyMainScreen(lobbyData);
    return;
};
