import { BlockPermutation, BlockVolume, BlockVolumeBase, Dimension, InvalidStructureError, Player, Structure, StructureManager, Vector3, system, world } from "@minecraft/server"
import { IBridgeData, Kit, blue_kit, bridgeNextRound, bridgeTick, red_kit } from "Bridge/bridge"
import { GlobalVars } from "globalVars"

import { Logger } from "staticScripts/Logger"
import { AwaitFunctions } from "staticScripts/awaitFunctions"
import { addCommand } from "staticScripts/commandFunctions"
import { TickFunctions } from "staticScripts/tickFunctions"
import { VectorFunctions } from "staticScripts/vectorFunctions"
import { json } from "stream/consumers"


export enum EGameMode {
    BRIDGE
}
export interface IMapData {
    name: string,
    description: string,
    gameMode: EGameMode,

    minimumPlayerAmount: number,
    players: Player[],

    startLocation: Vector3,
    endLocation: Vector3,
    
    structureId: string,
    structures: {structureSaveId: string, startPosition: Vector3}[],
    /**If the number is -1, the tick function is not used */
    tickFunctionId: number,
    mapId: number

    entities: {
        entityType: string
        entityLocation: Vector3
    }[]


    gameModeData: GameModeDataMap[EGameMode]


}

export interface GameModeDataMap {
    [EGameMode.BRIDGE]: IBridgeData;
    // Add more game modes here if needed
}

world.structureManager.delete("mapparser:airStruct");
const airStruct = world.structureManager.createEmpty("mapparser:airStruct", {x: 64, y: 64, z: 64});
class MapParser {

    static loadMap = async (mapData: IMapData, offset: Vector3, players: Player[]) => {
        Logger.warn(`Loading Map: ${mapData.name}`, "MapParser");
        const dimension = world.getDimension("overworld");
        const mapDataCopy = JSON.parse(JSON.stringify(mapData)) as IMapData;

        //Logger.warn(JSON.stringify(world.structureManager.getWorldStructureIds()))

        //find free index
        let findIndex = 0;
        while (currentMaps.has(findIndex)) {
            findIndex++;
        }
        //Manage Players
        if(mapData.minimumPlayerAmount > players.length) {            
            for(const player of players) {
                player.sendMessage(`Not enough players to start the map! MapID: ${findIndex} Map Name: ${mapData.name}`);
            }
            Logger.log(`Not enough players to start the map! MapID: ${findIndex} Map Name: ${mapData.name}`, "MapParser");
            return;
        }

        mapDataCopy.players = players;

        //load blocks
        
        mapDataCopy.endLocation = VectorFunctions.addVector(VectorFunctions.subtractVector(mapDataCopy.startLocation, mapDataCopy.endLocation), offset);
        mapDataCopy.startLocation = offset
        //Logger.warn(JSON.stringify(world.structureManager.getIds()))

        
        try{
            await this.placeStructureArray(mapDataCopy.structures, dimension, offset);
        }
        catch(e){
            if(e instanceof InvalidStructureError) {
                Logger.warn(`Invalid Structure ID: ${mapDataCopy.structureId}`, "MapParser");
                return;
            }
            Logger.warn(e, "MapParser");
        }
        

        //load entities (Implementing later since no map will use this yet)

        //load game mode data
        switch(mapDataCopy.gameMode) {
            case EGameMode.BRIDGE:
                const bridgeData = mapDataCopy.gameModeData as IBridgeData;
                let currentPlayerIndex = 0;
                for(const team of bridgeData.teams) {
                    for(let i = 0; i < team.playerAmount; i++) {
                        if(currentPlayerIndex >= players.length) {
                            break;
                        }
                        const player = players[currentPlayerIndex];
                        currentPlayerIndex++;
                        team.players.push(player);
                       
                    } 

                    //Add offset to capture points
                    for(const capturePoint of team.capturePoints) {
                        capturePoint.startPosition = VectorFunctions.addVector(capturePoint.startPosition, offset);
                        capturePoint.endPosition = VectorFunctions.addVector(capturePoint.endPosition, offset);
                    }

                    //Add offset to spawn barriers
                    for(const spawnBarrier of team.spawnBarriers) {
                        spawnBarrier.startPosition = VectorFunctions.addVector(spawnBarrier.startPosition, offset);
                        spawnBarrier.endPosition = VectorFunctions.addVector(spawnBarrier.endPosition, offset);
                    }

                    //Add offset to spawn points
                    // Add offset to spawn points
                    for (let i = 0; i < team.spawnPoints.length; i++) {
                        team.spawnPoints[i] = VectorFunctions.addVector(team.spawnPoints[i], offset);
                    }
                }

                mapDataCopy.tickFunctionId = TickFunctions.addFunction(bridgeTick.bind(this, mapDataCopy), 5)
                bridgeNextRound(mapDataCopy, "Round start!")
        }

        //Save the map
        currentMaps.set(findIndex, mapDataCopy);   
    }

    /**THIS IS ALSO USELESS SINCE WE PRELOADED THE STRUCTURES*/
    static placeLargeStructure = async (structureId: string, dimension: Dimension, startLocation: Vector3, endLocation: Vector3, offset: Vector3) => {
        const maxBlockSize = 63;
        const startX = startLocation.x;
        const startY = startLocation.y;
        const startZ = startLocation.z;
        const endX = endLocation.x;
        const endY = endLocation.y;
        const endZ = endLocation.z;

        if(startX > endX || startY > endY || startZ > endZ) {
            Logger.warn("Invalid start and end location", "MapParser");
        }
        for (let x = 0; x < endX - startX; x += maxBlockSize) {
            for (let y = 0; y < endY - startY; y += maxBlockSize) {
                for (let z = 0; z < endZ - startZ; z += maxBlockSize) {
                    Logger.warn(`Placing ${structureId} at ${x} ${y} ${z}`, "MapParser");
                    try{
                        const currentStart = { x: x + startX, y: y + startY, z: z + startZ };
                        const currentEnd = {
                            x: Math.min(currentStart.x + maxBlockSize, endX),
                            y: Math.min(currentStart.y + maxBlockSize, endY),
                            z: Math.min(currentStart.z + maxBlockSize, endZ)
                        };
                        for(const player of world.getAllPlayers()){
                          //  player.teleport(currentStart)
                        }
                        dimension.runCommandAsync(`tickingarea add ${currentStart.x} ${currentStart.y} ${currentStart.z} ${currentEnd.x} ${currentEnd.y} ${currentEnd.z} ${structureId} true`)
                        await AwaitFunctions.waitTicks(20);
                        Logger.warn(`Copying ${structureId} from ${currentStart.x} ${currentStart.y} ${currentStart.z} to ${currentEnd.x} ${currentEnd.y} ${currentEnd.z}`, "MapParser");
                        world.structureManager.delete(structureId)
                        const tempStructure = world.structureManager.createFromWorld(
                            structureId,
                            dimension,
                            new BlockVolume(currentStart, currentEnd),
                            { includeBlocks: true }
                        );
                        for(const player of world.getAllPlayers()){
                            player.teleport(offset)
                        }
                        await AwaitFunctions.waitTicks(20);
                        dimension.runCommandAsync(`tickingarea remove ${structureId}`)
                        
                        world.structureManager.place(tempStructure, dimension, VectorFunctions.addVector({x: x, y: y, z: z}, offset));
                    }
                    catch(e) {
                        if(e instanceof InvalidStructureError) {
                            Logger.warn(`Invalid Structure ID: ${structureId}`, "MapParser");
                            return;
                        }
                        Logger.warn(e, "MapParser");
                    }
                    
                }
            }
        }

    }

    static placeStructureArray = async (structures: {structureSaveId: string, startPosition: Vector3}[], dimension: Dimension,  offset: Vector3) => {
        for(const structure of structures) {
            Logger.warn(`Placing Preloaded ${structure.structureSaveId} at ${structure.startPosition.x} ${structure.startPosition.y} ${structure.startPosition.z}`, "MapParser");
            structure.startPosition = VectorFunctions.addVector(structure.startPosition, offset);
            world.structureManager.place(structure.structureSaveId, dimension, structure.startPosition);
        }
    }

     static createStructureArray = async (structureId: string, dimension: any, startLocation: Vector3, endLocation: Vector3): Promise<{structureSaveId: string, startPosition: Vector3}[]> => {
        return new Promise(async (resolve, reject) => {
            const structureArray: {structureSaveId: string, startPosition: Vector3}[] = [];
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
                            const tempStructure = world.structureManager.createFromWorld(
                                `${structureId}${x}${y}${z}`,
                                dimension,
                                new BlockVolume(currentStart, currentEnd),
                                { includeBlocks: true }
                            );

                            dimension.runCommandAsync(`tickingarea remove ${structureId}`);
                            await AwaitFunctions.waitTicks(40);
                            structureArray.push({structureSaveId: tempStructure.id, startPosition: {x: x, y: y, z: z}});
                        }
                    }
                }
                resolve(structureArray);
            } catch (e) {
                if (e instanceof InvalidStructureError) {
                    Logger.warn(`Invalid Structure ID: ${structureId}`, "MapParser");
                    reject(`Invalid Structure ID: ${structureId}`);
                } else {
                    Logger.warn(e, "MapParser");
                    reject(e);
                }
            }
        });
    }

    static unlaodMap = (mapID: number) => {
        Logger.warn("UN LOADING MAP", "MapParser");
        const overworld = world.getDimension("overworld");
        if(!currentMaps.has(mapID)) {
            Logger.warn(`Map ${mapID} not found`, "MapParser");
            return;
        }
        const currentMap = currentMaps.get(mapID);

        for(const player of currentMap.players) {
            player.teleport(GlobalVars.spawn)
        }

        switch (currentMap.gameMode) {
            case EGameMode.BRIDGE:
                const bridgeData = currentMap.gameModeData as IBridgeData;
                TickFunctions.removeFunction(currentMap.tickFunctionId);
        }

        for(const structure of currentMap.structures) {
            Logger.warn(`Placing Preloaded ${structure.structureSaveId} at ${structure.startPosition.x} ${structure.startPosition.y} ${structure.startPosition.z}`, "MapParser");
            for(let y = -32; y < 32; y++) {
                
                overworld.fillBlocks(VectorFunctions.addVector(structure.startPosition, {x: 0, y: y, z: 0}), VectorFunctions.addVector(structure.startPosition, {x: 63, y: y, z: 63}), "air");
            }
        }
        //THIS DOESNT WORK SINC EFILL BLOCK LIMIT IS 32000 OR SMTHN
        //overworld.fillBlocks(currentMap.startLocation, currentMap.endLocation, "air");
        currentMaps.delete(mapID);
    }

    /**
     * THIS IS USELESS SINCE WE SWITCHED TO STRUCTURE MANAGER
     * Print out a log of the map
     * @param 
     * @param 
     */
    static saveMap = (bL1: Vector3, bL2: Vector3) => {
        const overworld = world.getDimension("overworld");

        let combinedString = "";
        const lenghtX = (Math.abs(bL1.x - bL2.x) + 1);
        const lenghtY = (Math.abs(bL1.y - bL2.y) + 1);
        const lenghtZ = (Math.abs(bL1.z - bL2.z) + 1);


        const blockLocation = {
            x: Math.max(bL1.x, bL2.x),
            y: Math.max(bL1.y, bL2.y),
            z: Math.max(bL1.z, bL2.z)};

        for (var xOffset = 0; xOffset < lenghtX; xOffset++) {
        // player.sendMessage(`xOffset ${xOffset}`)
    
            for (var yOffset = 0; yOffset < lenghtY; yOffset++) {
                //   player.sendMessage(`yOffset ${yOffset}`)
    
                for (var zOffset = 0; zOffset < lenghtZ; zOffset++) {

                    const currentBlock = overworld.getBlock({ x: blockLocation.x - xOffset, y: blockLocation.y - yOffset, z: blockLocation.z - zOffset });
                    if(currentBlock.typeId == "minecraft:air") {
                        continue;
                    }
                    
                    combinedString += `{ `;
                    combinedString += `\t"blockLcoation": { x: ${xOffset}, y: ${ yOffset}, z: ${zOffset} },`;
                    //IDK HOW STATES WORK SO THIS IS A PLACEHOLDER
                    combinedString += `\t"blockState": ${1},"`;
                    combinedString += `\t"blockTags": [],`;
                    combinedString += `\t"blockType": "${currentBlock.typeId}"`;
                    combinedString += `},\n`;

                    
                }
            }
        }
        console.warn(combinedString);
    }
}

const currentMaps = new Map<number, IMapData>();



const testMap : IMapData = {
    name: "test",
    description: "test",
    gameMode: EGameMode.BRIDGE,
    minimumPlayerAmount: 1,
    players: [],

    startLocation: {x: -1047, y: 84, z: -1027},
    endLocation: {x:-965, y: 116, z: -1000},
    
    structureId: "mystructure:test",
    structures: [],

    tickFunctionId: -1,
    mapId: -1,

    entities: [
        
    ],
    gameModeData: {
        teams: [
            {
                playerAmount: 1,
                teamKit: blue_kit,
                teamScore: 0,
                teamName: "§9BLUE",
                players: [], 
                spawnPoints:[{x: 10, y: 21, z: 15}],
                capturePoints: [{startPosition: {x: 11, y: 8, z: 17}, endPosition: {x: 7, y: 8, z: 13}}],
                spawnBarrierBlockTypeID: "glass",
                spawnBarriers: [{startPosition: {x: 9, y: 20, z: 13}, endPosition: {x: 11, y: 20, z: 17}}]
            },
            {
                playerAmount: 1,
                teamKit: red_kit,
                teamScore: 0,
                teamName: "§4RED",
                players: [], 
                spawnPoints:[{x: 73, y: 21, z: 15}],
                capturePoints: [{startPosition: {x: 75, y: 8, z: 17}, endPosition: {x: 71, y: 8, z: 13}}],
                spawnBarrierBlockTypeID: "glass",
                spawnBarriers: [{startPosition: {x: 71, y: 20, z: 13}, endPosition: {x: 73, y: 20, z: 17}}]
            },
        ]
    }
}
const preloadMaps = async () => {
    Logger.warn("Loading Map")
    testMap.structures = await MapParser.createStructureArray(testMap.structureId, world.getDimension("overworld"), testMap.startLocation, testMap.endLocation)
    Logger.warn("Done Loading Map")
    Logger.warn(JSON.stringify(world.structureManager.getIds()))
    MapParser.loadMap(testMap, {x: 100, y: 50, z: 100}, world.getAllPlayers())
    system.runTimeout(() => {MapParser.unlaodMap(0)}, 500)
}
system.run(() => {
    
preloadMaps()
})

