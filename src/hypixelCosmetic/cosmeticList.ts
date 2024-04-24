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
    cosmeticFunction: (params: ICosmeticFunctionParameters) => void,
    cost: number
}
export const cosmeticList: ICosmetic[] = [
    { cosmeticType: ECosmeticType.NormalParticle, cosmeticId: "empty", cosmeticFunction: () => {}, cost: 0 },
    { cosmeticType: ECosmeticType.NormalParticle, cosmeticId: "footstepSoundCircle", cosmeticFunction: footstepSoundCircle, cost: 3 },
    // Jump particles
    { cosmeticType: ECosmeticType.JumpParticle, cosmeticId: "jumpPoofEffect", cosmeticFunction: jumpPoofEffect, cost: 3 }
];

//This is just for content assist this doesnt do liek anything in code if this makes sense just dw abt it :)
export type CosmeticId = {
    "empty": typeof cosmeticList[0];
    "footstepSoundCircle": typeof cosmeticList[1];
    "jumpPoofEffect": typeof cosmeticList[2];
};

// Arrow function to get ICosmetic object by CosmeticId string
export const getCosmeticById = (id: keyof CosmeticId | string): ICosmetic | undefined =>
    cosmeticList.find(cosmetic => cosmetic.cosmeticId === id);


 