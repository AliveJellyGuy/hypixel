import { world } from "@minecraft/server";
world.beforeEvents.itemUse.subscribe((eventData) => {
    //world.sendMessage(`Item use: ${JSON.stringify(eventData)}`)
});
