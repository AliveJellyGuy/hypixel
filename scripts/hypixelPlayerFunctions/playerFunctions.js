import { Player } from "@minecraft/server";
// player-extensions.ts
Object.defineProperties(Player.prototype, {
    winsCurrency: {
        get: function () {
            if (this.getDynamicProperty("winsCurrency") === undefined) {
                this.setDynamicProperty("winsCurrency", 0);
            }
            return this.getDynamicProperty("winsCurrency");
        },
        set: function (value) {
            this.setDynamicProperty("winsCurrency", value);
        }
    }
});
