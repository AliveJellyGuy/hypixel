import { world, GameMode } from "@minecraft/server";
/** @type {Map<string, string[]>} Map(Player Tag, List of breakable blocks)*/
const breakAllowed = new Map()
    .set("redBridge", ["red_terracotta", "blue_terracotta", "white_terracotta", "tallgrass"]);
world.afterEvents.playerBreakBlock.subscribe((eventdata) => {
    const player = eventdata.player;
    if (player.getGameMode() == GameMode.creative) {
        return;
    }
    const breakable = new Set();
    const playerTags = player.getTags();
    for (const playerTag of playerTags) {
        if (breakAllowed.has(playerTag)) {
            for (const blockName of breakAllowed.get(playerTag)) {
                if (!blockName.includes(":")) {
                    breakable.add(`minecraft:${blockName}`);
                    continue;
                }
                breakable.add(blockName);
            }
        }
    }
    if (!breakable.has(eventdata.brokenBlockPermutation.type.id)) {
        player.dimension.fillBlocks(eventdata.block.location, eventdata.block.location, eventdata.brokenBlockPermutation);
    }
});
