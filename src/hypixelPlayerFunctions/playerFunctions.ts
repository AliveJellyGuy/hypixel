import { Player } from "@minecraft/server";


declare module "@minecraft/server" {
    interface Player {
        winsCurrency: number
    }
}

Object.defineProperties(Player.prototype, {
    winsCurrency: {
        /**
         * The amount of win tokens the player has.
         * @returns {number}
         */
        get() : number {
            if(this.getDynamicProperty("winsCurrency") == undefined) {
                this.setDynamicProperty("winsCurrency", 0);
            }
            return this.getDynamicProperty("winsCurrency")
        },
        set(v : number) {
            this.setDynamicProperty("winsCurrency", v);
        },
    }
})