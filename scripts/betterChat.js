import { world } from '@minecraft/server';
const mainCmd = "!!";
const cpCmd = ";;";
world.sendMessage("Hypixel chat initialized!");
//hypixel chat
world.beforeEvents.chatSend.subscribe((eventData) => {
    eventData.cancel = true;
    const message = eventData.message;
    const player = eventData.sender;
    if (player.isOp() || player.hasTag("Admin")) {
        world.sendMessage(`§c[ADMIN] ${player.nameTag}§r: ${message}`);
    }
    else {
        world.sendMessage(`§a[VIP] ${player.nameTag}§r: ${message}`);
    }
});
