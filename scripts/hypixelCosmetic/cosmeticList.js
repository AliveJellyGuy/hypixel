import { footstepSoundCircle, jumpPoofEffect } from "./particleEffects";
export var ECosmeticType;
(function (ECosmeticType) {
    ECosmeticType[ECosmeticType["NormalParticle"] = 0] = "NormalParticle";
    ECosmeticType[ECosmeticType["JumpParticle"] = 1] = "JumpParticle";
})(ECosmeticType || (ECosmeticType = {}));
export const cosmeticList = [
    { cosmeticType: ECosmeticType.NormalParticle, cosmeticId: "empty", cosmeticFunction: () => { } },
    { cosmeticType: ECosmeticType.NormalParticle, cosmeticId: "footstepSoundCircle", cosmeticFunction: footstepSoundCircle },
    // Jump particles
    { cosmeticType: ECosmeticType.JumpParticle, cosmeticId: "jumpPoofEffect", cosmeticFunction: jumpPoofEffect }
];
// Arrow function to get ICosmetic object by CosmeticId string
export const getCosmeticById = (id) => cosmeticList.find(cosmetic => cosmetic.cosmeticId === id);
