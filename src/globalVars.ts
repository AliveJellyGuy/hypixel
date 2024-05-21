import { world, Player, Dimension, Vector3 } from "@minecraft/server"
export {GlobalVars}
class GlobalVars{
    /**
     * @type {Player[]}
     */
    static players = world.getAllPlayers()

    /**
     * @type {Dimension}
     */
    static overworld  = world.getDimension("overworld")

    static getPlayers(){
        this.players = world.getAllPlayers()
    }

    static spawn = {x: 150, y: 65, z: 5} as Vector3
}


