import { ChatSendBeforeEvent, Player, world } from "@minecraft/server";
import { CosmeticId, ECosmeticType, ICosmetic, ICosmeticFunctionParameters, cosmeticList, getCosmeticById } from "./cosmeticList";
import { TickFunctions } from "staticScripts/tickFunctions";
import { JumpFunctions } from "playerMovement/jumpFunctions";
import { GlobalVars } from "globalVars";
import { addCommand, showHUD } from "staticScripts/commandFunctions";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { isNumber } from "util";
import "../hypixelFunctions/playerFunctions";
import { Interface } from "readline";


const EnumKeys = Object.keys(ECosmeticType).filter(key =>  isNaN(Number(key)));
class PlayerCosmetic {
    player: Player;
    cosmetic: ICosmetic[] = new Array<ICosmetic>(EnumKeys.length);


    constructor(player: Player) {
        this.player = player;
        for(const key of EnumKeys){
            this.cosmetic[ECosmeticType[key]] = getCosmeticById("empty")
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

    setCosmetic = (cosmeticId : keyof CosmeticId |string, cosmeticSlot: ECosmeticType) => {
        this.cosmetic[cosmeticSlot] = getCosmeticById(cosmeticId);
        this.player.setDynamicProperty(`saved${ECosmeticType[cosmeticSlot]}`, cosmeticSlot);
        console.warn(`Saved under key: saved${ECosmeticType[cosmeticSlot]} value: ${cosmeticSlot}`);
    }

    unlockCosmetic = (cosmeticId : keyof CosmeticId | string) => {
        this.player.setDynamicProperty(`${cosmeticId}`, true);
    }

    lockCosmetic = (cosmeticId : keyof CosmeticId | string) => {
        this.player.setDynamicProperty(`${cosmeticId}`, false);
    }

    unlockAllCosmetics = () => {
        for(const cosmetic of cosmeticList){
            this.player.setDynamicProperty(`${cosmetic.cosmeticId}`, true);
        }
    }

    cosmeticShop = () => {
        const cosmeticShop = new ActionFormData();
        cosmeticShop.title("Cosmetics");
        
        const playerGold = this.player.getHypixelValue("winsCurrency");
        cosmeticShop.body("Select a cosmetic to buy: §a" + playerGold);
        for(const cosmetic of cosmeticList){
            if(this.player.getDynamicProperty(`${cosmetic.cosmeticId}`) as boolean){
                continue;
            }
            if(this.player.getHypixelValue("winsCurrency") >= cosmetic.cost){
                cosmeticShop.button(`${cosmetic.cosmeticId} \n§aCost: ${cosmetic.cost}`);
            } 
            else {
                cosmeticShop.button(`${cosmetic.cosmeticId} \n§cCost: ${cosmetic.cost}`);    
            }
        }
        showHUD(this.player, cosmeticShop).then((response) => {
            if(response.canceled){
                return;
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

const playerCosmeticeMap = new Map<Player, PlayerCosmetic>();

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