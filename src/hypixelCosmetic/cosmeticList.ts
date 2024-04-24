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
export const cosmeticList: ICosmetic[] = [
    { cosmeticType: ECosmeticType.NormalParticle, cosmeticId: "empty", cosmeticFunction: () => {} },
    { cosmeticType: ECosmeticType.NormalParticle, cosmeticId: "footstepSoundCircle", cosmeticFunction: footstepSoundCircle },
    // Jump particles
    { cosmeticType: ECosmeticType.JumpParticle, cosmeticId: "jumpPoofEffect", cosmeticFunction: jumpPoofEffect }
];

export type CosmeticId = {
    "empty": typeof cosmeticList[0];
    "footstepSoundCircle": typeof cosmeticList[1];
    "jumpPoofEffect": typeof cosmeticList[3];
};

// Arrow function to get ICosmetic object by CosmeticId string
export const getCosmeticById = (id: keyof CosmeticId | string): ICosmetic | undefined =>
    cosmeticList.find(cosmetic => cosmetic.cosmeticId === id);


 