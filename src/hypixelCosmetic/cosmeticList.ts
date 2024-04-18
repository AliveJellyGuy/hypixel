import { Player } from "@minecraft/server";
import { Interface } from "readline";
import { footstepSoundCircle, jumpPoofEffect } from "./particleEffects";
export interface ICosmeticFunctionParameters {
    player: Player
}

export enum ECosmeticType {
    NormalParticle,
    JumpParticle,
}

export interface ICosmetic {
    cosmeticType: ECosmeticType,
    cosmeticId: string,
    cosmeticFunction: (params: ICosmeticFunctionParameters) => void
}

export const cosmeticList : ICosmetic[] = [
    {cosmeticType: ECosmeticType.NormalParticle, cosmeticId: "footstepSoundCircle", cosmeticFunction: footstepSoundCircle},
    {cosmeticType: ECosmeticType.JumpParticle, cosmeticId: "jumpPoofEffect", cosmeticFunction: jumpPoofEffect}
]
