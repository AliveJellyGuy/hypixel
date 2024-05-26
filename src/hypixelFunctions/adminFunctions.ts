import { Player, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { addCommand, showHUD } from "staticScripts/commandFunctions";
import { PlayerValueType, playerValueTypeArray } from "./playerFunctions";
import { cosmeticList } from "hypixelCosmetic/cosmeticList";
import { lockAllCosmetics, lockCosmetic, unlockAllCosmetics, unlockCosmetic } from "hypixelCosmetic/cosmeticInventory";
import { askForConfirmation, choosePlayer } from "hud";
import { switchNamehud } from "customName";
import { Logger } from "staticScripts/Logger";

enum EAdminFunctionTypes {
    PlayerValues,
    CosmeticFunctions,
}
interface IAdminFunction {
    functionType: EAdminFunctionTypes,
    functionId: string,
    func : (val: AdminFunctiontType) => void
}

interface AdminFunctiontType {
    player?: Player,
}

const adminFunctionsArray: IAdminFunction[] = [
    {functionType: EAdminFunctionTypes.PlayerValues, functionId: "setPlayerValues", func: (val: AdminFunctiontType) => {setPlayerValues(val)}},
    {functionType: EAdminFunctionTypes.CosmeticFunctions, functionId: "unlockCosmetic", func: (val: AdminFunctiontType) => {unlockPlayerCosmetic(val)}},
    {functionType: EAdminFunctionTypes.CosmeticFunctions, functionId: "lockCosmetic", func: (val: AdminFunctiontType) => {lockPlayerCosmetic(val)}},
    {functionType: EAdminFunctionTypes.CosmeticFunctions, functionId: "Rename player", func: (val: AdminFunctiontType) => {changePlayerName(val)}},
]

addCommand({commandName: "admin", chatFunction: ((event) => {showAdminPanel(event.sender)}), directory: "twla/lmao", commandPrefix: "!!"})


function isValidNumber(inputStr: string): boolean {
    const numericRepr = parseFloat(inputStr);
    return !isNaN(numericRepr) && numericRepr.toString().length === inputStr.length;
}



const showAdminPanel = (player: Player) => {
    Logger.log(`Showing admin panel for ${player.name}`, "Admin")
    const adminPanel = new ActionFormData();
    adminPanel.title("Admin Panel");
    for (const adminFunction of adminFunctionsArray) {
        adminPanel.button(adminFunction.functionId)
    }
    showHUD(player, adminPanel).then((response) => {
        if(response.canceled) {return}	
        adminFunctionsArray[response.selection].func({player: player})
    })
}

const setPlayerValues = async (params: AdminFunctiontType) => {
    const showHUDPlayer = params.player;
    const setValuesPlayer = await choosePlayer(showHUDPlayer).then((player) => {return player})
    const playerValuesPanel = new ModalFormData();
    playerValuesPanel.title("Player Values");

    for (const key of playerValueTypeArray) {
        // Iterate over the keys of IPlayerValues object
        playerValuesPanel.textField(key, String(setValuesPlayer.getHypixelValue(key)), String(setValuesPlayer.getHypixelValue(key)));
    }
    showHUD(showHUDPlayer, playerValuesPanel).then((response) => {
        if(response.canceled) {return}
        for (let i = 0; i < response.formValues.length; i++) {
            const value = response.formValues[i];
            if(!isValidNumber(value as string)) {
                showHUDPlayer.sendMessage(`Expected Number! ${value}`)    
                continue
            }
            // Set the values based on the order of keys
            setValuesPlayer.setHypixelValue(playerValueTypeArray[i] , Number(response.formValues[i]));
        }
    })
};

const unlockPlayerCosmetic = async (params: AdminFunctiontType) => {
    const showHUDPlayer = params.player;
    const unlockPlayer = await choosePlayer(showHUDPlayer).then((player) => {return player})
    const unlockCosmeticsPanel = new ActionFormData();
    unlockCosmeticsPanel.title("Unlock Cosmetics");
    unlockCosmeticsPanel.button("All");
    for(const cosmetic of cosmeticList){
        unlockCosmeticsPanel.button(cosmetic.cosmeticId);
    }

    showHUD(showHUDPlayer, unlockCosmeticsPanel).then((response) => {
        if(response.canceled) {return}
        if(response.selection === 0) {
            if(askForConfirmation(unlockPlayer, "Are you sure you want to unlock all cosmetics?").then((res) => {return res})) {
                unlockAllCosmetics(unlockPlayer)
            }
            return;
        } else {
            unlockCosmetic(unlockPlayer, cosmeticList[response.selection - 1].cosmeticId);
        }

    })
}

const lockPlayerCosmetic = async (params: AdminFunctiontType) => {
    const showHUDPlayer = params.player;
    const lockPlayer = await choosePlayer(showHUDPlayer).then((player) => {return player})
    const lockCosmeticsPanel = new ActionFormData();
    lockCosmeticsPanel.title("Lock Cosmetics");
    lockCosmeticsPanel.button("All");
    for(const cosmetic of cosmeticList){
        lockCosmeticsPanel.button(cosmetic.cosmeticId);
    }

    showHUD(showHUDPlayer, lockCosmeticsPanel).then((response) => {
        if(response.canceled) {return}
        if(response.selection === 0) {
            if(askForConfirmation(lockPlayer, "Are you sure you want to lock all cosmetics?").then((res) => {return res})) {
                lockAllCosmetics(lockPlayer)
            }
            return;
        } else {
            lockCosmetic(lockPlayer, cosmeticList[response.selection - 1].cosmeticId);
        }

    })
}

/** rename hud ;;nick @tutorial */
const changePlayerName = async (params: AdminFunctiontType)=>{
    const showHudPlayer = params.player
    const switchNamePlayer = await choosePlayer(showHudPlayer)
    switchNamehud(showHudPlayer, switchNamePlayer)
}