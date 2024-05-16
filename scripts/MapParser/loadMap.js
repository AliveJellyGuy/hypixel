var _a;
import { BlockVolume, InvalidStructureError, system, world } from "@minecraft/server";
import { blue_kit, bridgeNextRound, bridgeTick, red_kit } from "Bridge/bridge";
import { Logger } from "staticScripts/Logger";
import { AwaitFunctions } from "staticScripts/awaitFunctions";
import { TickFunctions } from "staticScripts/tickFunctions";
import { VectorFunctions } from "staticScripts/vectorFunctions";
export var EGameMode;
(function (EGameMode) {
    EGameMode[EGameMode["BRIDGE"] = 0] = "BRIDGE";
})(EGameMode || (EGameMode = {}));
class MapParser {
}
_a = MapParser;
MapParser.loadMap = async (mapData, offset, players) => {
    Logger.warn(`Loading Map: ${mapData.name}`, "MapParser");
    const dimension = world.getDimension("overworld");
    const mapDataCopy = JSON.parse(JSON.stringify(mapData));
    //Logger.warn(JSON.stringify(world.structureManager.getWorldStructureIds()))
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
    mapDataCopy.endLocation = VectorFunctions.addVector(VectorFunctions.subtractVector(mapDataCopy.startLocation, mapDataCopy.endLocation), offset);
    mapDataCopy.startLocation = offset;
    //Logger.warn(JSON.stringify(world.structureManager.getIds()))
    try {
        await _a.placeStructureArray(mapDataCopy.structures, dimension, offset);
    }
    catch (e) {
        if (e instanceof InvalidStructureError) {
            Logger.warn(`Invalid Structure ID: ${mapDataCopy.structureId}`, "MapParser");
            return;
        }
        Logger.warn(e, "MapParser");
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
                //Add offset to capture points
                for (const capturePoint of team.capturePoints) {
                    capturePoint.startPosition = VectorFunctions.addVector(capturePoint.startPosition, offset);
                    capturePoint.endPosition = VectorFunctions.addVector(capturePoint.endPosition, offset);
                }
                //Add offset to spawn barriers
                for (const spawnBarrier of team.spawnBarriers) {
                    spawnBarrier.startPosition = VectorFunctions.addVector(spawnBarrier.startPosition, offset);
                    spawnBarrier.endPosition = VectorFunctions.addVector(spawnBarrier.endPosition, offset);
                }
                //Add offset to spawn points
                // Add offset to spawn points
                for (let i = 0; i < team.spawnPoints.length; i++) {
                    team.spawnPoints[i] = VectorFunctions.addVector(team.spawnPoints[i], offset);
                }
            }
            mapDataCopy.tickFunctionId = TickFunctions.addFunction(bridgeTick.bind(_a, mapDataCopy), 5);
            bridgeNextRound(mapDataCopy);
    }
    //Save the map
    currentMaps.set(findIndex, mapDataCopy);
};
/**THIS IS ALSO USELESS SINCE WE PRELOADED THE STRUCTURES*/
MapParser.placeLargeStructure = async (structureId, dimension, startLocation, endLocation, offset) => {
    const maxBlockSize = 63;
    const startX = startLocation.x;
    const startY = startLocation.y;
    const startZ = startLocation.z;
    const endX = endLocation.x;
    const endY = endLocation.y;
    const endZ = endLocation.z;
    if (startX > endX || startY > endY || startZ > endZ) {
        Logger.warn("Invalid start and end location", "MapParser");
    }
    for (let x = 0; x < endX - startX; x += maxBlockSize) {
        for (let y = 0; y < endY - startY; y += maxBlockSize) {
            for (let z = 0; z < endZ - startZ; z += maxBlockSize) {
                Logger.warn(`Placing ${structureId} at ${x} ${y} ${z}`, "MapParser");
                try {
                    const currentStart = { x: x + startX, y: y + startY, z: z + startZ };
                    const currentEnd = {
                        x: Math.min(currentStart.x + maxBlockSize, endX),
                        y: Math.min(currentStart.y + maxBlockSize, endY),
                        z: Math.min(currentStart.z + maxBlockSize, endZ)
                    };
                    for (const player of world.getAllPlayers()) {
                        //  player.teleport(currentStart)
                    }
                    dimension.runCommandAsync(`tickingarea add ${currentStart.x} ${currentStart.y} ${currentStart.z} ${currentEnd.x} ${currentEnd.y} ${currentEnd.z} ${structureId} true`);
                    await AwaitFunctions.waitTicks(20);
                    Logger.warn(`Copying ${structureId} from ${currentStart.x} ${currentStart.y} ${currentStart.z} to ${currentEnd.x} ${currentEnd.y} ${currentEnd.z}`, "MapParser");
                    world.structureManager.delete(structureId);
                    const tempStructure = world.structureManager.createFromWorld(structureId, dimension, new BlockVolume(currentStart, currentEnd), { includeBlocks: true });
                    for (const player of world.getAllPlayers()) {
                        player.teleport(offset);
                    }
                    await AwaitFunctions.waitTicks(20);
                    dimension.runCommandAsync(`tickingarea remove ${structureId}`);
                    world.structureManager.place(tempStructure, dimension, VectorFunctions.addVector({ x: x, y: y, z: z }, offset));
                }
                catch (e) {
                    if (e instanceof InvalidStructureError) {
                        Logger.warn(`Invalid Structure ID: ${structureId}`, "MapParser");
                        return;
                    }
                    Logger.warn(e, "MapParser");
                }
            }
        }
    }
};
MapParser.placeStructureArray = async (structures, dimension, offset) => {
    for (const structure of structures) {
        Logger.warn(`Placing Preloaded ${structure.structureSaveId} at ${structure.startPosition.x} ${structure.startPosition.y} ${structure.startPosition.z}`, "MapParser");
        world.structureManager.place(structure.structureSaveId, dimension, VectorFunctions.addVector(structure.startPosition, offset));
    }
};
MapParser.createStructureArray = async (structureId, dimension, startLocation, endLocation) => {
    return new Promise(async (resolve, reject) => {
        const structureArray = [];
        const maxBlockSize = 63;
        const startX = startLocation.x;
        const startY = startLocation.y;
        const startZ = startLocation.z;
        const endX = endLocation.x;
        const endY = endLocation.y;
        const endZ = endLocation.z;
        try {
            for (let x = 0; x < endX - startX; x += maxBlockSize) {
                for (let y = 0; y < endY - startY; y += maxBlockSize) {
                    for (let z = 0; z < endZ - startZ; z += maxBlockSize) {
                        Logger.warn(`Saving ${structureId} at ${x} ${y} ${z}`, "MapParser");
                        const currentStart = { x: x + startX, y: y + startY, z: z + startZ };
                        const currentEnd = {
                            x: Math.min(currentStart.x + maxBlockSize, endX),
                            y: Math.min(currentStart.y + maxBlockSize, endY),
                            z: Math.min(currentStart.z + maxBlockSize, endZ)
                        };
                        dimension.runCommandAsync(`tickingarea add ${currentStart.x} ${currentStart.y} ${currentStart.z} ${currentEnd.x} ${currentEnd.y} ${currentEnd.z} ${structureId} true`);
                        await AwaitFunctions.waitTicks(40);
                        world.structureManager.delete(`${structureId}${x}${y}${z}`);
                        const tempStructure = world.structureManager.createFromWorld(`${structureId}${x}${y}${z}`, dimension, new BlockVolume(currentStart, currentEnd), { includeBlocks: true });
                        dimension.runCommandAsync(`tickingarea remove ${structureId}`);
                        await AwaitFunctions.waitTicks(40);
                        structureArray.push({ structureSaveId: tempStructure.id, startPosition: { x: x, y: y, z: z } });
                    }
                }
            }
            resolve(structureArray);
        }
        catch (e) {
            if (e instanceof InvalidStructureError) {
                Logger.warn(`Invalid Structure ID: ${structureId}`, "MapParser");
                reject(`Invalid Structure ID: ${structureId}`);
            }
            else {
                Logger.warn(e, "MapParser");
                reject(e);
            }
        }
    });
};
MapParser.unlaodMap = (mapID) => {
    Logger.warn("UN LOADING MAP", "MapParser");
    const overworld = world.getDimension("overworld");
    if (!currentMaps.has(mapID)) {
        Logger.warn(`Map ${mapID} not found`, "MapParser");
        return;
    }
    const currentMap = currentMaps.get(mapID);
    switch (currentMap.gameMode) {
        case EGameMode.BRIDGE:
            const bridgeData = currentMap.gameModeData;
            TickFunctions.removeFunction(currentMap.tickFunctionId);
    }
    //THIS DOESNT WORK SINC EFILL BLOCK LIMIT IS 32000 OR SMTHN
    overworld.fillBlocks(currentMap.startLocation, currentMap.endLocation, "air");
    currentMaps.delete(mapID);
};
/**
 * THIS IS USELESS SINCE WE SWITCHED TO STRUCTURE MANAGER
 * Print out a log of the map
 * @param
 * @param
 */
MapParser.saveMap = (bL1, bL2) => {
    const overworld = world.getDimension("overworld");
    let combinedString = "";
    const lenghtX = (Math.abs(bL1.x - bL2.x) + 1);
    const lenghtY = (Math.abs(bL1.y - bL2.y) + 1);
    const lenghtZ = (Math.abs(bL1.z - bL2.z) + 1);
    const blockLocation = {
        x: Math.max(bL1.x, bL2.x),
        y: Math.max(bL1.y, bL2.y),
        z: Math.max(bL1.z, bL2.z)
    };
    for (var xOffset = 0; xOffset < lenghtX; xOffset++) {
        // player.sendMessage(`xOffset ${xOffset}`)
        for (var yOffset = 0; yOffset < lenghtY; yOffset++) {
            //   player.sendMessage(`yOffset ${yOffset}`)
            for (var zOffset = 0; zOffset < lenghtZ; zOffset++) {
                const currentBlock = overworld.getBlock({ x: blockLocation.x - xOffset, y: blockLocation.y - yOffset, z: blockLocation.z - zOffset });
                if (currentBlock.typeId == "minecraft:air") {
                    continue;
                }
                combinedString += `{ `;
                combinedString += `\t"blockLcoation": { x: ${xOffset}, y: ${yOffset}, z: ${zOffset} },`;
                //IDK HOW STATES WORK SO THIS IS A PLACEHOLDER
                combinedString += `\t"blockState": ${1},"`;
                combinedString += `\t"blockTags": [],`;
                combinedString += `\t"blockType": "${currentBlock.typeId}"`;
                combinedString += `},\n`;
            }
        }
    }
    console.warn(combinedString);
};
const currentMaps = new Map();
const testMap = {
    name: "test",
    description: "test",
    gameMode: EGameMode.BRIDGE,
    minimumPlayerAmount: 1,
    startLocation: { x: -1047, y: 84, z: -1027 },
    endLocation: { x: -965, y: 116, z: -1000 },
    structureId: "mystructure:test",
    structures: [],
    tickFunctionId: -1,
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
const preloadMaps = async () => {
    Logger.warn("Loading Map");
    testMap.structures = await MapParser.createStructureArray(testMap.structureId, world.getDimension("overworld"), testMap.startLocation, testMap.endLocation);
    Logger.warn("Done Loading Map");
    Logger.warn(JSON.stringify(world.structureManager.getIds()));
    MapParser.loadMap(testMap, { x: 0, y: -20, z: 0 }, world.getAllPlayers());
    system.runTimeout(() => { MapParser.unlaodMap(0); }, 500);
};
preloadMaps();
