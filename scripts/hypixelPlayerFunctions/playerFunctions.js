import { Player } from "@minecraft/server";
Object.defineProperties(Player.prototype, {
    winsCurrency: {
        /**
         * The amount of win tokens the player has.
         * @returns {number}
         */
        get() {
            if (this.getDynamicProperty("winsCurrency") == undefined) {
                this.setDynamicProperty("winsCurrency", 0);
            }
            return this.getDynamicProperty("winsCurrency");
        },
        set(v) {
            this.setDynamicProperty("winsCurrency", v);
        },
    }
});
