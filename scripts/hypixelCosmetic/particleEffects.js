import { system, world } from "@minecraft/server";
import { AwaitFunctions } from "staticScripts/awaitFunctions";
import { DrawFunctions } from "staticScripts/drawFunctions";
import { TickFunctions } from "staticScripts/tickFunctions";
import { VectorFunctions } from "staticScripts/vectorFunctions";
export const playerParticles = new Map();
TickFunctions.addFunction(() => {
    for (const [key, value] of playerParticles) {
        value({ player: key });
    }
}, 1);
const footstepSoundCircle = (particleFunctionParamters) => {
    const player = particleFunctionParamters.player;
    const playerSpeed = VectorFunctions.vectorLengthXZ(player.getVelocity());
    const frequency = 2;
    const circleParticle = async () => {
        const location = player.location;
        const circleResolution = 32;
        const circleRadius = 1;
        const circleExpansionTime = 5;
        for (let i = circleExpansionTime; i > 0; i--) {
            await AwaitFunctions.waitTicks(5);
            DrawFunctions.drawSphere(circleResolution, circleRadius / i, location);
        }
    };
    //console.warn(`${system.currentTick % Math.floor(frequency / playerSpeed)}`)
    if (system.currentTick % Math.floor(frequency / playerSpeed) == 0 && player.getVelocity().y == 0) {
        circleParticle();
    }
};
for (const playe of world.getAllPlayers()) {
    playerParticles.set(playe, footstepSoundCircle);
}
