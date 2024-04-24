import { world } from "@minecraft/server";
import { ECosmeticType, cosmeticList, getCosmeticById } from "./cosmeticList";
import { TickFunctions } from "staticScripts/tickFunctions";
import { JumpFunctions } from "playerMovement/jumpFunctions";
import { GlobalVars } from "globalVars";
import { addCommand, showHUD } from "staticScripts/commandFunctions";
import { ActionFormData } from "@minecraft/server-ui";
import "../hypixelPlayerFunctions/playerFunctions";
const EnumKeys = Object.keys(ECosmeticType).filter(key => isNaN(Number(key)));
class PlayerCosmetic {
    constructor(player) {
        this.cosmetic = new Array(EnumKeys.length);
        this.tick = (player) => {
            this.cosmetic[ECosmeticType.NormalParticle].cosmeticFunction({ player: player });
        };
        this.jumpParticle = (player) => {
            this.cosmetic[ECosmeticType.JumpParticle].cosmeticFunction({ player: player });
        };
        this.cosmeticTypeHud = () => {
            const cosmeticTypeHud = new ActionFormData();
            cosmeticTypeHud.title("Cosmetics");
            //do not add more buttons or else it will not work, since im not good at typescript
            for (const key of EnumKeys) {
                cosmeticTypeHud.button(key);
            }
            showHUD(this.player, cosmeticTypeHud).then((response) => { if (response.canceled) {
                return;
            } ; this.showCosmeticHud(response.selection); });
        };
        this.showCosmeticHud = (type) => {
            const cosmeticHud = new ActionFormData();
            const cosmetics = new Array();
            cosmeticHud.title("Cosmetics");
            if (type != ECosmeticType.NormalParticle) {
                cosmetics.push("empty");
                cosmeticHud.button("empty");
            }
            let buttonAmount = 1;
            for (let i = 0; i < cosmeticList.length; i++) {
                if (cosmeticList[i].cosmeticType != type) {
                    continue;
                }
                console.warn(this.player.getDynamicProperty(`${cosmeticList[i].cosmeticId}`));
                if (!this.player.getDynamicProperty(`${cosmeticList[i].cosmeticId}`)) {
                    continue;
                }
                cosmetics.push(cosmeticList[i].cosmeticId);
                cosmeticHud.button(cosmeticList[i].cosmeticId);
            }
            showHUD(this.player, cosmeticHud).then((response) => {
                if (response.canceled) {
                    return;
                }
                console.warn(cosmetics[response.selection]);
                if (cosmetics[response.selection] === "empty") {
                    this.cosmetic[type] = getCosmeticById("empty");
                    this.player.setDynamicProperty(`saved${ECosmeticType[type]}`, cosmetics[response.selection]);
                    return;
                }
                this.cosmetic[type] = getCosmeticById(cosmetics[response.selection]);
                this.player.setDynamicProperty(`saved${ECosmeticType[type]}`, cosmetics[response.selection]);
                console.warn(`Saved under key: saved${ECosmeticType[type]} value: ${cosmetics[response.selection]}`);
            });
        };
        this.setCosmetic = (cosmeticId, cosmeticSlot) => {
            this.cosmetic[cosmeticSlot] = getCosmeticById(cosmeticId);
            this.player.setDynamicProperty(`saved${ECosmeticType[cosmeticSlot]}`, cosmeticSlot);
            console.warn(`Saved under key: saved${ECosmeticType[cosmeticSlot]} value: ${cosmeticSlot}`);
        };
        this.unlockCosmetic = (cosmeticId) => {
            this.player.setDynamicProperty(`${cosmeticId}`, true);
        };
        this.lockCosmetic = (cosmeticId) => {
            this.player.setDynamicProperty(`${cosmeticId}`, false);
        };
        this.unlockAllCosmetics = () => {
            for (const cosmetic of cosmeticList) {
                this.player.setDynamicProperty(`${cosmetic.cosmeticId}`, true);
            }
        };
        this.cosmeticShop = () => {
            const cosmeticShop = new ActionFormData();
            cosmeticShop.title("Cosmetics");
            console.warn(this.player.winsCurrency);
            cosmeticShop.body("Select a cosmetic to buy: §a" + this.player.winsCurrency);
            for (const cosmetic of cosmeticList) {
                if (this.player.getDynamicProperty(`${cosmetic.cosmeticId}`)) {
                    continue;
                }
                if (this.player.winsCurrency >= cosmetic.cost) {
                    cosmeticShop.button(`${cosmetic.cosmeticId} \n§aCost: ${cosmetic.cost}`);
                }
                else {
                    cosmeticShop.button(`${cosmetic.cosmeticId} \n§cCost: ${cosmetic.cost}`);
                }
            }
            showHUD(this.player, cosmeticShop).then((response) => {
                if (response.canceled) {
                    return;
                }
            });
        };
        this.player = player;
        for (const key of EnumKeys) {
            this.cosmetic[ECosmeticType[key]] = getCosmeticById("empty");
            this.cosmetic[ECosmeticType[key]] = getCosmeticById(player.getDynamicProperty(`saved${key}`));
        }
        //This is only debug prop should remove this also idk waht happens if nothing is defined
        TickFunctions.addFunction(() => this.tick(this.player), 1);
        JumpFunctions.addPressedJumpFunction(player => this.jumpParticle(player));
    }
}
addCommand({ commandName: "cosmetic", chatFunction: ((event) => { equipCosmetic(event); }), directory: "Cosmetics", commandPrefix: ";;" });
addCommand({ commandName: "shop", chatFunction: ((event) => { playerCosmeticeMap.get(event.sender).cosmeticShop(); }), directory: "Cosmetics", commandPrefix: ";;" });
const equipCosmetic = (eventData) => {
    playerCosmeticeMap.get(eventData.sender).cosmeticTypeHud();
};
const buyCosmetic = (eventData) => {
    playerCosmeticeMap.get(eventData.sender).cosmeticShop();
};
const playerCosmeticeMap = new Map();
for (const player of GlobalVars.players) {
    playerCosmeticeMap.set(player, new PlayerCosmetic(player));
    playerCosmeticeMap.get(player).unlockCosmetic("empty");
}
world.afterEvents.playerSpawn.subscribe((eventData) => {
    const { player } = eventData;
    if (!playerCosmeticeMap.has(player)) {
        playerCosmeticeMap.set(player, new PlayerCosmetic(player));
        playerCosmeticeMap.get(player).unlockCosmetic("empty");
    }
});
