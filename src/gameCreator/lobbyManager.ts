import { Player, world } from "@minecraft/server"
import { ActionFormData } from "@minecraft/server-ui"
import { MapParser } from "MapParser/loadMap"


const mapSelector = () => {

}

const createLobby = async () => {
    const mapSelectHud = new ActionFormData()
    mapSelectHud.title("Map Selector")
}

const inviteToLobby = (inviteSender: Player) => {
    
}