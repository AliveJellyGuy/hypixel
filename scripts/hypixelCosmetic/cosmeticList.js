import { footstepSoundCircle, jumpPoofEffect } from "./particleEffects";
export var ECosmeticType;
(function (ECosmeticType) {
    ECosmeticType[ECosmeticType["NormalParticle"] = 0] = "NormalParticle";
    ECosmeticType[ECosmeticType["JumpParticle"] = 1] = "JumpParticle";
})(ECosmeticType || (ECosmeticType = {}));
export const cosmeticList = [
    { cosmeticType: ECosmeticType.NormalParticle, cosmeticId: "empty", cosmeticFunction: () => { }, cost: 0 },
    { cosmeticType: ECosmeticType.NormalParticle, cosmeticId: "footstepSoundCircle", cosmeticFunction: footstepSoundCircle, cost: 3 },
    // Jump particles
    { cosmeticType: ECosmeticType.JumpParticle, cosmeticId: "jumpPoofEffect", cosmeticFunction: jumpPoofEffect, cost: 3 }
];
// Arrow function to get ICosmetic object by CosmeticId string
export const getCosmeticById = (id) => cosmeticList.find(cosmetic => cosmetic.cosmeticId === id);
