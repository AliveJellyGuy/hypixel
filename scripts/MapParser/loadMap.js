var _a;
import { BlockPermutation, world } from "@minecraft/server";
import { blue_kit, bridgeNextRound, bridgeTick, red_kit } from "Bridge/bridge";
import { Logger } from "staticScripts/Logger";
import { TickFunctions } from "staticScripts/tickFunctions";
import { VectorFunctions } from "staticScripts/vectorFunctions";
var EGameMode;
(function (EGameMode) {
    EGameMode[EGameMode["BRIDGE"] = 0] = "BRIDGE";
})(EGameMode || (EGameMode = {}));
class MapParser {
}
_a = MapParser;
MapParser.loadMap = (mapData, offset, players) => {
    Logger.warn(`Loading Map: ${mapData.name}`, "MapParser");
    const dimension = world.getDimension("overworld");
    const mapDataCopy = JSON.parse(JSON.stringify(mapData));
    //find free index
    let findIndex = 0;
    while (currentMaps.has(findIndex)) {
        findIndex++;
    }
    if (mapData.minimumPlayerAmount > players.length) {
        for (const player of players) {
            player.sendMessage(`Not enough players to start the map! MapID: ${findIndex} Map Name: ${mapData.name}`);
        }
        Logger.log(`Not enough players to start the map! MapID: ${findIndex} Map Name: ${mapData.name}`, "MapParser");
        return;
    }
    //load blocks
    for (const block of mapDataCopy.blocks) {
        const blockPermutation = BlockPermutation.resolve(block.blockType);
        const location = VectorFunctions.addVector(block.blockLcoation, offset);
        players[0].teleport(location);
        dimension.setBlockPermutation(location, blockPermutation);
    }
    //load entities (Implementing later since no map will use this yet)
    //load game mode data
    switch (mapDataCopy.gameMode) {
        case EGameMode.BRIDGE:
            const bridgeData = mapDataCopy.gameModeData;
            let currentPlayerIndex = 0;
            for (const team of bridgeData.teams) {
                for (let i = 0; i < team.playerAmount; i++) {
                    const player = players[currentPlayerIndex];
                    team.players.push(player);
                    player.teleport(team.spawnPoints[i % team.spawnPoints.length]);
                }
            }
            TickFunctions.addFunction(bridgeTick.bind(_a, mapDataCopy), 5);
            bridgeNextRound(mapDataCopy);
    }
    //Save the map
    currentMaps.set(findIndex, mapDataCopy);
};
MapParser.unlaodMap = (mapID) => {
    const overworld = world.getDimension("overworld");
    //overworld.fillBlocks()
    currentMaps.delete(mapID);
};
const currentMaps = new Map();
const testMap = {
    name: "test",
    description: "test",
    gameMode: EGameMode.BRIDGE,
    minimumPlayerAmount: 1,
    blocks: [
        {
            blockLcoation: { x: 0, y: 0, z: 0 },
            blockState: 0,
            blockTags: [],
            blockType: "red_terracotta"
        },
    ],
    entities: [],
    gameModeData: {
        teams: [
            {
                playerAmount: 1,
                teamKit: red_kit,
                teamScore: 0,
                teamName: "test",
                players: [],
                spawnPoints: [{ x: 0, y: 10, z: 0 }],
                capturePoints: [{ startPosition: { x: -3, y: 10, z: -3 }, endPosition: { x: 3, y: 10, z: 3 } }],
                spawnBarrierBlockTypeID: "grass_block",
                spawnBarriers: [{ startPosition: { x: -3, y: 10, z: -3 }, endPosition: { x: 3, y: 10, z: 3 } }]
            },
            {
                playerAmount: 1,
                teamKit: blue_kit,
                teamScore: 0,
                teamName: "test2",
                players: [],
                spawnPoints: [{ x: 0, y: 11, z: 0 }],
                capturePoints: [{ startPosition: { x: -3, y: 10, z: -3 }, endPosition: { x: 3, y: 10, z: 3 } }],
                spawnBarrierBlockTypeID: "stone",
                spawnBarriers: [{ startPosition: { x: 0, y: 10, z: 0 }, endPosition: { x: 0, y: 10, z: 0 } }]
            },
        ]
    }
};
MapParser.loadMap(testMap, { x: 0, y: 0, z: 0 }, world.getAllPlayers());
