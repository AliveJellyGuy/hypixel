import { Player, world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { addCommand, showHUD } from "staticScripts/commandFunctions";
import { PlayerValueType, playerValueTypeArray } from "./playerFunctions";
import { cosmeticList } from "hypixelCosmetic/cosmeticList";
import { lockAllCosmetics, lockCosmetic, unlockAllCosmetics, unlockCosmetic } from "hypixelCosmetic/cosmeticInventory";
import { askForConfirmation } from "hud";

enum EAdminFunctionTypes {
    CosmeticFunctions,
}
interface IAdminFunction {
    functionType: EAdminFunctionTypes,
    functionId: string,
    func : () => void
}

const adminFunctionsArray: IAdminFunction[] = [
    {functionType: EAdminFunctionTypes.CosmeticFunctions, functionId: "lockAllCosmetics", func: () => {lockAllCosmetics()}},
]

addCommand({commandName: "admin", chatFunction: ((event) => {showAdminPanel(event.sender)}), directory: "twla/lmao", commandPrefix: "!!"})


function isValidNumber(inputStr: string): boolean {
    const numericRepr = parseFloat(inputStr);
    return !isNaN(numericRepr) && numericRepr.toString().length === inputStr.length;
}

const choosePlayer = (showHUDPlayer: Player) : Promise<Player> => {
    const choosePlayerPanel = new ActionFormData();
    choosePlayerPanel.title("Choose Player");
    const playerNameArray= [...world.getPlayers().map((player) => player.name)];
    for (const player of world.getPlayers()) {
        choosePlayerPanel.button(player.name)
    }
    return showHUD(showHUDPlayer, choosePlayerPanel).then((response) => {
        if(response.canceled) {return}
        return world.getPlayers({name: playerNameArray[response.selection]})[0]
    })
}

const showAdminPanel = (player: Player) => {
    setPlayerValues(player, player)
}

const setPlayerValues = (showHUDPlayer: Player, setValuesPlayer: Player) => {
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

addCommand({commandName: "unlock", chatFunction: ((event) => {unlockPlayerCosmetic(event.sender, event.sender)}), directory: "twla/lmao", commandPrefix: "!!"})

const unlockPlayerCosmetic =(showHUDPlayer: Player, unlockPlayer: Player) => {
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

addCommand({commandName: "lock", chatFunction: ((event) => {lockPlayerCosmetic(event.sender, event.sender)}), directory: "twla/lmao", commandPrefix: "!!"})
const lockPlayerCosmetic =(showHUDPlayer: Player, lockPlayer: Player) => {
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