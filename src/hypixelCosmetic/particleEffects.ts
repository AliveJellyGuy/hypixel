import { Player, system, world } from "@minecraft/server";
import { AwaitFunctions } from "staticScripts/awaitFunctions";
import { DrawFunctions } from "staticScripts/drawFunctions";
import { TickFunctions } from "staticScripts/tickFunctions";
import { VectorFunctions } from "staticScripts/vectorFunctions";
import { ICosmeticFunctionParameters } from "./cosmeticList";

export const emptyParticle = (particleFunctionParamters: ICosmeticFunctionParameters) => {
    
}
export const footstepSoundCircle = (particleFunctionParamters: ICosmeticFunctionParameters) => {
    const player = particleFunctionParamters.player;
    const playerSpeed = VectorFunctions.vectorLengthXZ(player.getVelocity());
    const frequency = 2;
    const circleParticle = async () => {
        const location = player.location;
        const circleResolution = 32;
        const circleRadius = 1;
        const circleExpansionTime = 5;
        for(let i = circleExpansionTime; i > 0; i--){
            await AwaitFunctions.waitTicks(5);
            DrawFunctions.drawSphere(circleResolution, circleRadius / i, location);
        }
    }
    //console.warn(`${system.currentTick % Math.floor(frequency / playerSpeed)}`)
    if(system.currentTick % Math.floor(frequency / playerSpeed) == 0 && player.getVelocity().y == 0){
        circleParticle();
    }
    
}

export const jumpPoofEffect = (particleFunctionParamters: ICosmeticFunctionParameters) => {
    const player = particleFunctionParamters.player;
    const location = player.location;
    const jumpPoofParticle = async () => {
        system.run(async () => {
            //player.playSound("note.iron_xylophone")
        })
        player.dimension.spawnParticle("minecraft:totem_particle", location)
    }
    jumpPoofParticle();
    
}