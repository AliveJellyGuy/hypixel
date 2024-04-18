import { footstepSoundCircle, jumpPoofEffect } from "./particleEffects";
export var ECosmeticType;
(function (ECosmeticType) {
    ECosmeticType[ECosmeticType["NormalParticle"] = 0] = "NormalParticle";
    ECosmeticType[ECosmeticType["JumpParticle"] = 1] = "JumpParticle";
})(ECosmeticType || (ECosmeticType = {}));
export const cosmeticList = [
    { cosmeticType: ECosmeticType.NormalParticle, cosmeticId: "footstepSoundCircle", cosmeticFunction: footstepSoundCircle },
    { cosmeticType: ECosmeticType.JumpParticle, cosmeticId: "jumpPoofEffect", cosmeticFunction: jumpPoofEffect }
];
