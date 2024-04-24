import { world } from "@minecraft/server";
import { ECosmeticType, cosmeticList, getCosmeticById } from "./cosmeticList";
import { TickFunctions } from "staticScripts/tickFunctions";
import { JumpFunctions } from "playerMovement/jumpFunctions";
import { GlobalVars } from "globalVars";
import { addCommand, showHUD } from "staticScripts/commandFunctions";
import { ActionFormData } from "@minecraft/server-ui";
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
        this.player = player;
        for (const key of EnumKeys) {
            this.cosmetic[ECosmeticType[key]] = getCosmeticById("empty");
            this.cosmetic[ECosmeticType[key]] = getCosmeticById(player.getDynamicProperty(`saved${key}`));
        }
        //This is only debug prop should remove this also idk waht happens if nothing is defined
        TickFunctions.addFunction(() => this.tick(this.player), 1);
        JumpFunctions.addPressedJumpFunction(player => this.jumpParticle(player));
        addCommand({ commandName: "cosmetic", chatFunction: ((event) => { this.cosmeticTypeHud(); }), directory: "Cosmetics", commandPrefix: ";;" });
    }
}
const playerCosmeticeMap = new Map();
for (const player of GlobalVars.players) {
    playerCosmeticeMap.set(player, new PlayerCosmetic(player));
}
world.afterEvents.playerSpawn.subscribe((eventData) => {
    const { player } = eventData;
    if (!playerCosmeticeMap.has(player)) {
        playerCosmeticeMap.set(player, new PlayerCosmetic(player));
    }
});
