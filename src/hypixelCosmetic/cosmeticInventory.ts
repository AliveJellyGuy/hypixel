import { BlockPermutation, ChatSendBeforeEvent, Player, world } from "@minecraft/server";
import { CosmeticId, ECosmeticType, ICosmetic, ICosmeticFunctionParameters, cosmeticList, getCosmeticById } from "./cosmeticList";
import { TickFunctions } from "staticScripts/tickFunctions";
import { JumpFunctions } from "playerMovement/jumpFunctions";
import { GlobalVars } from "globalVars";
import { addCommand, showHUD } from "staticScripts/commandFunctions";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { isNumber } from "util";
import "../hypixelFunctions/playerFunctions";
import { Interface } from "readline";
import { askForConfirmation } from "hud";
import { LinkedList } from "dataTypes/linkedList";
import { Logger } from "staticScripts/Logger";


const EnumKeys = Object.keys(ECosmeticType).filter(key =>  isNaN(Number(key)));
class PlayerCosmetic {
    player: Player;
    cosmetic: ICosmetic[] = new Array<ICosmetic>(EnumKeys.length);


    constructor(player: Player) {
        this.player = player;
        for(const key of EnumKeys){
            this.cosmetic[ECosmeticType[key]] = getCosmeticById("empty")
            if(player.getDynamicProperty(`saved${key}`) !== undefined)
            this.cosmetic[ECosmeticType[key]] = getCosmeticById(player.getDynamicProperty(`saved${key}`) as string)
        }
        //This is only debug prop should remove this also idk waht happens if nothing is defined

        TickFunctions.addFunction(() => this.tick(this.player), 1);
        JumpFunctions.addPressedJumpFunction(player => this.jumpParticle(player));
    }

    tick = (player : Player) => {
        this.cosmetic[ECosmeticType.NormalParticle].cosmeticFunction({player: player});
    }

    jumpParticle = (player : Player) => {
        this.cosmetic[ECosmeticType.JumpParticle].cosmeticFunction({player: player});
    }

    cosmeticTypeHud = () => {
        const cosmeticTypeHud = new ActionFormData();
        cosmeticTypeHud.title("Cosmetics");
        //do not add more buttons or else it will not work, since im not good at typescript
        for(const key of EnumKeys){
            cosmeticTypeHud.button(key);
        }
        showHUD(this.player, cosmeticTypeHud).then((response) => {if(response.canceled) {return};this.showCosmeticHud(response.selection)});
    }

    showCosmeticHud = (type: ECosmeticType) => {
        const cosmeticHud = new ActionFormData();
        const cosmetics : Array<string> = new Array();
        cosmeticHud.title("Cosmetics");
        if(type != ECosmeticType.NormalParticle){
            cosmetics.push("empty");
            cosmeticHud.button("empty");
        }
        let buttonAmount = 1;
        for (let i = 0; i < cosmeticList.length; i++) {
            if(cosmeticList[i].cosmeticType != type){
                continue;
            }
            console.warn(this.player.getDynamicProperty(`${cosmeticList[i].cosmeticId}`) as boolean);
            if(!this.player.getDynamicProperty(`${cosmeticList[i].cosmeticId}`) as boolean){
                continue;
            }
            cosmetics.push(cosmeticList[i].cosmeticId);
            cosmeticHud.button(cosmeticList[i].cosmeticId);
        }
        showHUD(this.player, cosmeticHud).then((response) => {
            if(response.canceled){
                return;
            }
            console.warn(cosmetics[response.selection]);
            if(cosmetics[response.selection] === "empty"){
                this.cosmetic[type] = getCosmeticById("empty");
                this.player.setDynamicProperty(`saved${ECosmeticType[type]}`, cosmetics[response.selection]);

                return
            }
            this.cosmetic[type] = getCosmeticById(cosmetics[response.selection]);
            this.player.setDynamicProperty(`saved${ECosmeticType[type]}`, cosmetics[response.selection]);
            console.warn(`Saved under key: saved${ECosmeticType[type]} value: ${cosmetics[response.selection]}`);
        });
    }

    setCosmetic = (cosmeticId : keyof CosmeticId, cosmeticSlot: ECosmeticType) => {

        this.cosmetic[cosmeticSlot] = getCosmeticById(cosmeticId);
        this.player.setDynamicProperty(`saved${ECosmeticType[cosmeticSlot]}`, cosmeticSlot);
        Logger.log(`${this.player.name} Equipped ${cosmeticId}`, "Cosmetics");
        console.warn(`Saved under key: saved${ECosmeticType[cosmeticSlot]} value: ${cosmeticSlot}`);
    }

    unlockCosmetic = (cosmeticId : keyof CosmeticId | string) => {
        Logger.log(`Unlocked ${cosmeticId}`, "Cosmetics");
        this.player.setDynamicProperty(`${cosmeticId}`, true);
    }

    lockCosmetic = (cosmeticId : keyof CosmeticId | string) => {
        this.player.setDynamicProperty(`${cosmeticId}`, false);
        this.player.setDynamicProperty(`empty`, true)
        
        const cosmeticType = getCosmeticById(cosmeticId).cosmeticType;
        Logger.log(`Locked ${cosmeticType}`, "Cosmetics");
        if(this.cosmetic[cosmeticType].cosmeticId == cosmeticId){
            this.setCosmetic("empty", cosmeticType);
        };
    }

    unlockAllCosmetics = () => {
        Logger.log(`Unlocked all cosmetics for ${this.player.name}`, "Cosmetics");
        for(const cosmetic of cosmeticList){
            this.player.setDynamicProperty(`${cosmetic.cosmeticId}`, true);
        }

    }

    lockAllCosmetics = () => {
        Logger.log(`Locked all cosmetics for ${this.player.name}`, "Cosmetics");
        for(const cosmetic of cosmeticList){
            this.player.setDynamicProperty(`${cosmetic.cosmeticId}`, false);
        }
            this.player.setDynamicProperty(`empty`, true)
        for(const key of EnumKeys){
            this.player.setDynamicProperty(`saved${key}`, "empty");
            this.cosmetic[ECosmeticType[key]] = getCosmeticById("empty");
        }
    }

    cosmeticShop = () => {
        
        const cosmeticShop = new ActionFormData();
        cosmeticShop.title("Cosmetics");
        
        const playerGold = this.player.getHypixelValue("winsCurrency");
        cosmeticShop.body("Select a cosmetic to buy: §a" + playerGold);
        let cosmeticsLeftToBuy = false;
        const buyableCosmetics : LinkedList<ICosmetic> = new LinkedList<ICosmetic>();
        for(const cosmetic of cosmeticList){
            if(this.player.getDynamicProperty(`${cosmetic.cosmeticId}`) as boolean){
                continue;
            }
            cosmeticsLeftToBuy = true;
            buyableCosmetics.append(cosmetic);
            if(this.player.getHypixelValue("winsCurrency") >= cosmetic.cost){
                cosmeticShop.button(`${cosmetic.cosmeticId} \n§aCost: ${cosmetic.cost}`);
            } 
            else {
                cosmeticShop.button(`${cosmetic.cosmeticId} \n§cCost: ${cosmetic.cost}`);    
            }
        }
        if(!cosmeticsLeftToBuy){
            this.player.sendMessage("All cosmetics have been purchased!");
            return;
        }
        showHUD(this.player, cosmeticShop).then((response) => {
            if(response.canceled){
                return;
            }
            
            if(buyableCosmetics.getNodebyIndex(response.selection).data.cost > this.player.getHypixelValue("winsCurrency")){
                this.player.sendMessage("You don't have enough gold!");
                return;
                
            }
            else {
                askForConfirmation(this.player, `Are you sure you want to buy ${buyableCosmetics.getNodebyIndex(response.selection).data.cosmeticId}?`).then((res) => {
                    if(res){
                        this.unlockCosmetic(buyableCosmetics.getNodebyIndex(response.selection).data.cosmeticId);
                        this.player.setHypixelValue("winsCurrency", this.player.getHypixelValue("winsCurrency") - buyableCosmetics.getNodebyIndex(response.selection).data.cost);
                        console.log(`Purchased ${buyableCosmetics.getNodebyIndex(response.selection).data.cosmeticId} for ${buyableCosmetics.getNodebyIndex(response.selection).data.cost} by ${this.player.name}`);
                    }
                    askForConfirmation(this.player, "Do you want to equip this cosmetic?").then((res2) => {
                        if(res2){
                            this.setCosmetic(buyableCosmetics.getNodebyIndex(response.selection).data.cosmeticId, buyableCosmetics.getNodebyIndex(response.selection).data.cosmeticType);
                        }
                    })
                })
            }
        })
    }
}



addCommand({commandName: "cosmetic",chatFunction: ((event) => {equipCosmetic(event)}), directory: "Cosmetics", commandPrefix: ";;"})
addCommand({commandName: "shop",chatFunction: ((event) => {playerCosmeticeMap.get(event.sender).cosmeticShop()}), directory: "Cosmetics", commandPrefix: ";;"})
const equipCosmetic = (eventData: ChatSendBeforeEvent) => {
    playerCosmeticeMap.get(eventData.sender).cosmeticTypeHud()
}

const buyCosmetic = (eventData: ChatSendBeforeEvent) => {
   playerCosmeticeMap.get(eventData.sender).cosmeticShop()
}

export const unlockCosmetic = (player: Player, cosmeticId : keyof CosmeticId | string) => {
    playerCosmeticeMap.get(player).unlockCosmetic(cosmeticId);
}

export const unlockAllCosmetics = (player: Player) => {
    playerCosmeticeMap.get(player).unlockAllCosmetics();
}

export const lockCosmetic = (player: Player, cosmeticId : keyof CosmeticId | string) => {
    playerCosmeticeMap.get(player).lockCosmetic(cosmeticId);
}

export const lockAllCosmetics = (player: Player) => {
    playerCosmeticeMap.get(player).lockAllCosmetics();
}

export const playerCosmeticeMap = new Map<Player, PlayerCosmetic>();

for(const player of GlobalVars.players){
    playerCosmeticeMap.set(player, new PlayerCosmetic(player))
    playerCosmeticeMap.get(player).unlockCosmetic("empty");
}

world.afterEvents.playerSpawn.subscribe((eventData) => {
    const {player} = eventData;
    if(!playerCosmeticeMap.has(player)){
        playerCosmeticeMap.set(player, new PlayerCosmetic(player))
        playerCosmeticeMap.get(player).unlockCosmetic("empty");
    }
    
})