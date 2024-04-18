import { world } from "@minecraft/server";
import { ECosmeticType, cosmeticList } from "./cosmeticList";
import { TickFunctions } from "staticScripts/tickFunctions";
import { JumpFunctions } from "playerMovement/jumpFunctions";
import { GlobalVars } from "globalVars";
const EnumKeys = Object.keys(ECosmeticType);
class PlayerCosmetic {
    constructor(player) {
        this.cosmetic = new Array(EnumKeys.length);
        this.tick = () => {
            this.cosmetic[ECosmeticType.NormalParticle].cosmeticFunction({ player: this.player });
        };
        this.jumpParticle = () => {
            this.cosmetic[ECosmeticType.JumpParticle].cosmeticFunction({ player: this.player });
        };
        this.player = player;
        for (const key of Object.keys(ECosmeticType)) {
            this.cosmetic[ECosmeticType[key]] = cosmeticList.find(cosmetic => cosmetic.cosmeticId == player.getDynamicProperty(key));
        }
        //This is only debug prop should remove this also idk waht happens if nothing is defined
        this.cosmetic[ECosmeticType.NormalParticle] = cosmeticList.find(cosmetic => cosmetic.cosmeticId == "footstepSoundCircle");
        this.cosmetic[ECosmeticType.JumpParticle] = cosmeticList.find(cosmetic => cosmetic.cosmeticId == "jumpPoofEffect");
        TickFunctions.addFunction(() => this.tick(), 1);
        JumpFunctions.addPressedJumpFunction(player => this.jumpParticle());
    }
}
const playerCosmeticeMap = new Map();
for (const key of Object.keys(ECosmeticType)) {
    console.warn(key);
}
for (const player of GlobalVars.players) {
    playerCosmeticeMap.set(player, new PlayerCosmetic(player));
}
world.afterEvents.playerSpawn.subscribe((eventData) => {
    const { player } = eventData;
    if (!playerCosmeticeMap.has(player)) {
        playerCosmeticeMap.set(player, new PlayerCosmetic(player));
    }
});
