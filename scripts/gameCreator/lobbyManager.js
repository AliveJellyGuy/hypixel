import { ActionFormData } from "@minecraft/server-ui";
import { MapParser } from "MapParser/loadMap";
import { mapList } from "MapParser/mapList";
import { LinkedList } from "dataTypes/linkedList";
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
    lobbyMainScreen.button("Change Map");
    lobbyMainScreen.button("Custom Settings");
    for (const player of lobbyData.otherPlayers) {
        lobbyMainScreen.button(player.name);
    }
    await showHUD(lobbyData.hostPlayer, lobbyMainScreen).then(async (res) => {
        if (res.canceled) {
            return;
        }
        if (res.selection === 0) {
            lobbys.deleteNodeByValue(lobbyData);
            lobbyClosed = true;
        }
        if (res.selection === 1) {
            MapParser.loadMap(lobbyData.selectedMap.mapData, { x: 200, y: 50, z: 100 }, [...lobbyData.otherPlayers, lobbyData.hostPlayer]);
            lobbys.deleteNodeByValue(lobbyData);
            lobbyClosed = true;
        }
        if (res.selection === 2) {
            lobbyData.selectedMap = await mapSelector(lobbyData.hostPlayer);
            return;
        }
    });
    if (lobbyClosed) {
        return;
    }
    createLobbyMainScreen(lobbyData);
};
const inviteToLobby = (inviteSender) => {
};
