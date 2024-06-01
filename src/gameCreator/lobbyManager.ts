import { Player, world } from "@minecraft/server"
import { ActionFormData, ModalFormData } from "@minecraft/server-ui"
import { MapParser } from "MapParser/loadMap"
import { IMapID, mapList } from "MapParser/mapList"
import { LinkedList } from "dataTypes/linkedList"
import { askForConfirmation, choosePlayer } from "hud"
import { Logger } from "staticScripts/Logger"
import { addCommand, showHUD } from "staticScripts/commandFunctions"


const lobbys: LinkedList<ILobbyData> = new LinkedList<ILobbyData>()

interface ILobbyData {
    selectedMap: IMapID
    lobbyId: number
    publicLobby: boolean
    inviteOnly: boolean
    lobbyName: string
    lobbyPassword: string
    hostPlayer: Player
    otherPlayers: Player[]
}

const mapSelector = async(showHudPlayer: Player) : Promise<IMapID>  => {

    const mapSelectHud = new ActionFormData()
    mapSelectHud.title("Map Selector")
    for(const map of mapList) {
        mapSelectHud.button(map.mapName)
    }

    const selectedMap : IMapID = await showHUD(showHudPlayer, mapSelectHud).then((res) => {
        return mapList[res.selection]
    })

    return selectedMap
}

    //#region Map Selector
    //#endregion
const createLobby = async (hostPlayer: Player, otherPlayers: Player[]) => {
    let findID = 0;
    while(lobbys.some(lobby => lobby.lobbyId === findID)) {
        findID++;
    }
    let lobbyData : ILobbyData 

    const createLobbyInitialScreen = new ModalFormData()
    createLobbyInitialScreen.title("Create Lobby")
    createLobbyInitialScreen.toggle("Public", false)
    createLobbyInitialScreen.toggle("Invite Only", false)
    createLobbyInitialScreen.textField("Lobby Name", "Lobby Name", `${hostPlayer.name}'s lobby`)
    createLobbyInitialScreen.textField("Lobby Password", "Lobby Password", "")

    await showHUD(hostPlayer, createLobbyInitialScreen).then(async (res) => {
        if(res.canceled) {return}
        lobbyData = {
            selectedMap: await mapSelector(hostPlayer),
            lobbyId: findID,
            publicLobby: res.formValues[0] as boolean,
            inviteOnly: res.formValues[1] as boolean,
            lobbyName: res.formValues[2] as string,
            lobbyPassword: res.formValues[3] as string,
            hostPlayer: hostPlayer,
            otherPlayers: otherPlayers
        }
    })



    lobbys.append(lobbyData)
    //#region Lobby main screen
    createLobbyMainScreen(lobbyData)
}
addCommand({commandName: "createLobby", chatFunction: ((event) => {createLobby(event.sender, [])}), directory: "twla/lmao", commandPrefix: ";;"})

const browseLobbys = async (searchingPlayer: Player) => {
    const lobbyListHud = new ActionFormData()
    lobbyListHud.title("Lobby List")
    lobbys.forEach(lobby => {
        if(!lobby.publicLobby) {return}
        lobbyListHud.button(lobby.lobbyName)
    })
    await showHUD(searchingPlayer, lobbyListHud).then((res) => {
        if(res.canceled) {return}
        const lobby = lobbys.getNodebyIndex(res.selection).data
        lobbyPasswordCheck(searchingPlayer, lobby)
    })
}
addCommand({commandName: "browseLobbys", chatFunction: ((event) => {browseLobbys(event.sender)}), directory: "twla/lmao", commandPrefix: ";;"})

const joinLobbyManually = async (searchingPlayer: Player) => {
    if(searchingPlayer.getHypixelValue("currentMatchID") != -1) {
        searchingPlayer.sendMessage(`§cYou are already in a match.`)
        return
    }
    const joinLobbyHud = new ModalFormData()
    joinLobbyHud.title("Enter Lobby Name")
    joinLobbyHud.textField("Lobby Name", "Lobby Name", "")
    await showHUD(searchingPlayer, joinLobbyHud).then((res) => {
        if(res.canceled) {return}
        const lobby = lobbys.find(lobby => lobby.lobbyName === res.formValues[0]);
        if(lobby == null){
            searchingPlayer.sendMessage(`§cCouldn't find Lobby with name ${res.formValues[0]}.`)    
            return
        }
        lobbyPasswordCheck(searchingPlayer, lobby)
    })
}
addCommand({commandName: "joinLobbyManually", chatFunction: ((event) => {joinLobbyManually(event.sender)}), directory: "twla/lmao", commandPrefix: ";;"})

const lobbyPasswordCheck = async (joiningPlayer: Player, lobbyData: ILobbyData) => {
    if(lobbyData.inviteOnly) {
        joiningPlayer.sendMessage(`§cThis lobby is invite only.`);
        return
    }
    if(lobbyData.lobbyPassword === "") {
        lobbyData.otherPlayers.push(joiningPlayer);
        joiningPlayer.sendMessage(`§aSuccessfully joined the lobby.`);
        lobbyData.hostPlayer.sendMessage(`§a${joiningPlayer.name} joined the lobby.`);
        Logger.warn(`${joiningPlayer.name} joined ${lobbyData.lobbyName} `, "LobbyManager");
        return;
    }

    const passwordInput = new ModalFormData();
    passwordInput.title(`Enter lobby password for ${lobbyData.lobbyName})`)
    passwordInput.textField("Lobby Password", "Lobby Password", "")
    await showHUD(joiningPlayer, passwordInput).then((res) => {
        if(res.canceled) {return}
        if(res.formValues[0] === lobbyData.lobbyPassword) {
            lobbyData.otherPlayers.push(joiningPlayer);
            joiningPlayer.sendMessage(`§aSuccessfully joined the lobby.`);
            lobbyData.hostPlayer.sendMessage(`§a${joiningPlayer.name} joined the lobby.`);
            Logger.warn(`${joiningPlayer.name} joined ${lobbyData.lobbyName} `, "LobbyManager");
            return
        } else {
            joiningPlayer.sendMessage(`§cIncorrect password. Please try again.`)
        }
    })
}

const createLobbyMainScreen = async (lobbyData: ILobbyData) => {
    Logger.warn("Lobby Main Screen", "LobbyManager")
    let lobbyClosed = false;
    const lobbyMainScreen = new ActionFormData()
    lobbyMainScreen.title("Lobby Main Screen")
    lobbyMainScreen.body("Current Map: " + lobbyData.selectedMap.mapName)
    lobbyMainScreen.button("Close Lobby") 
    lobbyMainScreen.button("Start Game")
    lobbyMainScreen.button("Refresh Player List")
    lobbyMainScreen.button("Invite Players")
    lobbyMainScreen.button("Change Map")
    lobbyMainScreen.button("Custom Settings")
    for(const player of lobbyData.otherPlayers) {
        lobbyMainScreen.button(player.name)
    }

    await showHUD(lobbyData.hostPlayer, lobbyMainScreen).then(async (res) => {
        if(res.canceled) {return}

        switch(res.selection) {
            case 0:
                lobbys.deleteNodeByValue(lobbyData)
                lobbyClosed = true
                return
            case 1:
                MapParser.loadMap(lobbyData.selectedMap.mapData, {x: 200, y: 50, z: 100}, [lobbyData.hostPlayer, ...lobbyData.otherPlayers])
                lobbys.deleteNodeByValue(lobbyData)
                lobbyClosed = true
                return
            case 2:
                return
            case 3:
                await inviteToLobby(lobbyData, lobbyData.hostPlayer)
                return
            case 4:
                lobbyData.selectedMap = await mapSelector(lobbyData.hostPlayer)
                return
            default:
                playerInLobbyOperations(lobbyData, res.selection - 5)

        }
        
    })

    if(lobbyClosed) {return}
    createLobbyMainScreen(lobbyData)
}


const inviteToLobby = async (lobbyData: ILobbyData,inviteSender: Player) => {
    const playerToInvite = await choosePlayer(inviteSender)

    if(playerToInvite.getSetting("doNotDisturb")){
        playerToInvite.sendMessage(`§c${lobbyData.hostPlayer.name} tried to invite you, but you are on do not disturb.`)
        const failMessage = new ActionFormData()
        failMessage.title("Invite Failed")
        failMessage.body("This player is on do not disturb.")
        failMessage.button("Ok")
        await showHUD(inviteSender, failMessage)
        createLobbyMainScreen(lobbyData)
        return;
    }

    //askForConfirmation(playerToInvite, "Do you want to invite " + playerToInvite.name + " to the lobby?").then((res) => {
    //    if(res) {
    //        
    //    }
    //})
    askForConfirmation(playerToInvite, `Join lobby from ${lobbyData.hostPlayer.name}?`).then((res) => {
        if(!res){
            askForConfirmation(playerToInvite, `Turn on do not disturb?`).then((res) => {
                if(res) {
                    playerToInvite.setSetting("doNotDisturb", true)
                }
            })
            return;
        }

        lobbyData.otherPlayers.push(playerToInvite)
        inviteSender.sendMessage(`§a${playerToInvite.name} joined the lobby.`)
    })
    createLobbyMainScreen(lobbyData)
}

const playerInLobbyOperations = async (lobbyData: ILobbyData, playerIndex: number) => {
    const player = lobbyData.otherPlayers[playerIndex]
    const playerOperations = new ActionFormData()
    playerOperations.title("Player Operations")
    playerOperations.body(`Player: ${player.name} aka. ${player.nameTag}`)
    playerOperations.button("Kick Player")
    
    await showHUD(player, playerOperations).then((res) => {
        if(res.canceled) {return}
        switch(res.selection) {
            case 0:
                lobbyData.otherPlayers.splice(playerIndex, 1)
                return
        }
    })

    createLobbyMainScreen(lobbyData)
    return
}