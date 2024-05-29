import { BlockPermutation, BlockVolume, BlockVolumeBase, Dimension, InvalidStructureError, Player, Structure, StructureManager, Vector3, system, world } from "@minecraft/server"
import { IBridgeData, Kit,  bridgeNextRound, bridgeStart, bridgeTick } from "Bridge/bridge"
import { GlobalVars } from "globalVars"

import { Logger } from "staticScripts/Logger"
import { AwaitFunctions } from "staticScripts/awaitFunctions"
import { addCommand } from "staticScripts/commandFunctions"
import { TickFunctions } from "staticScripts/tickFunctions"
import { VectorFunctions } from "staticScripts/vectorFunctions"
import { testMap } from "./Bridge Maps/brideMaps"
import { EMapList, mapList } from "./mapList"

function deepCopy(obj: any) {
    // Check if the value is an object or function, otherwise return it directly
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // Handle Date
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    // Handle Array
    if (Array.isArray(obj)) {
        const arrCopy: any[] = [];
        obj.forEach((_, i) => {
            arrCopy[i] = deepCopy(obj[i]);
        });
        return arrCopy;
    }

    // Handle Object
    const objCopy: any = {};
    Object.keys(obj).forEach(key => {
        objCopy[key] = deepCopy(obj[key]);
    });
    return objCopy;
}

export enum EGameMode {
    BRIDGE = 0
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
    playerSpawnFunction: (mapData: IMapData, player: Player) => void

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
export class MapParser {

    static currentMaps = new Map<number, IMapData>();

    //#region Loading Functions

    static loadMapById = async (mapId: EMapList, offset: Vector3, Players: Player[]) => {
        
    }

    static loadMap = async (mapData: IMapData, offset: Vector3, players: Player[]) => {
        Logger.warn(`Loading Map: ${mapData.name}`, "MapParser");
        const dimension = world.getDimension("overworld");
        const mapDataCopy = deepCopy(mapData) as IMapData;

        for(const player of players) {
            MapParser.removePlayerFromAllMaps(player);
        }
        //Logger.warn(JSON.stringify(world.structureManager.getWorldStructureIds()))

        //find free index
        let findIndex = 0;
        while (this.currentMaps.has(findIndex)) {
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
            await this.placeStructureArray(mapDataCopy.structures, dimension, offset, players);
        }
        catch(e){
            if(e instanceof InvalidStructureError) {
                Logger.warn(`Invalid Structure ID: ${mapDataCopy.structureId}`, "MapParser");
                return;
            }
            Logger.warn(e, "MapParser");
        }
        
        for(const player of players){
            player.setSpawnFunction(mapDataCopy.playerSpawnFunction.bind(null, mapDataCopy, player));
            player.setHypixelValue("currentMatchID", findIndex);
        }
        

        //load entities (Implementing later since no map will use this yet)

        //load game mode data
        switch(mapDataCopy.gameMode) {
            case EGameMode.BRIDGE:
                bridgeStart(mapDataCopy, offset);
        }

        mapDataCopy.mapId = findIndex;
        //Save the map
        this.currentMaps.set(findIndex, mapDataCopy);   

    }
    //#endregion 

    //#region Structures
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

    static placeStructureArray = async (structures: {structureSaveId: string, startPosition: Vector3}[], dimension: Dimension,  offset: Vector3, players: Player[]) => {
        
        for(const structure of structures) {
            Logger.warn(`Placing Preloaded ${structure.structureSaveId} at ${structure.startPosition.x} ${structure.startPosition.y} ${structure.startPosition.z}`, "MapParser");
            structure.startPosition = VectorFunctions.addVector(structure.startPosition, offset);
            let chunkLoaded = false;
            while(!chunkLoaded){
                dimension.runCommandAsync(`tickingarea add circle ${structure.startPosition.x} ${structure.startPosition.y} ${structure.startPosition.z} 2 ${structure.structureSaveId} true`);
                players[0].teleport(structure.startPosition)
                await AwaitFunctions.waitTicks(5);
                try{
                    //To see if the chunks are loaded
                    dimension.fillBlocks(structure.startPosition, structure.startPosition, "air");
                    world.structureManager.place(structure.structureSaveId, dimension, structure.startPosition);
                    dimension.runCommandAsync(`tickingarea remove ${structure.structureSaveId}`);
                    chunkLoaded = true;
                }
                catch{
                    Logger.warn("Failed to place structure trying again in 5 ticks", "MapParser");
                }
                
            }
           
        }
    }

    static createStructureArray = async (structureId: string, dimension: Dimension, startLocation: Vector3, endLocation: Vector3): Promise<{structureSaveId: string, startPosition: Vector3}[]> => {
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
                            Logger.warn(`Adding ${structureId} at ${x} ${y} ${z}`, "MapParser");
                            const currentStart = { x: x + startX, y: y + startY, z: z + startZ };
                            const currentEnd = {
                                x: Math.min(currentStart.x + maxBlockSize, endX),
                                y: Math.min(currentStart.y + maxBlockSize, endY),
                                z: Math.min(currentStart.z + maxBlockSize, endZ)
                            };

                            let chunkLoaded = false;
                            let tempStructure: Structure
                            while(!chunkLoaded) {

                                dimension.runCommandAsync(`tickingarea add ${currentStart.x} ${currentStart.y} ${currentStart.z} ${currentEnd.x} ${currentEnd.y} ${currentEnd.z} ${structureId} true`);
                                await AwaitFunctions.waitTicks(10);
                                world.structureManager.delete(`${structureId}${x}${y}${z}`);
                                try{
                                    //Test if the structure is fully loaded by filling air block
                                    dimension.fillBlocks(currentStart, currentStart, "air");
                                    tempStructure = world.structureManager.createFromWorld(
                                        `${structureId}${x}${y}${z}`,
                                        dimension,
                                        new BlockVolume(currentStart, currentEnd),
                                        { includeBlocks: true }
                                    );
                                    chunkLoaded = true;
                                }
                                catch{
                                    Logger.warn("Tickingarea not loaded in fully, waiting another 10 ticks and hoping for the best :)", "Preloading Maps")
                                }
                            }
                            Logger.warn(`Saving ${structureId} at ${x} ${y} ${z}`, "MapParser");
                            dimension.runCommandAsync(`tickingarea remove ${structureId}`);
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
    //#endregion

    //#region Unloading Functions
    static unlaodMap = (mapID: number) => {
        Logger.warn("UN LOADING MAP", "MapParser");
        const overworld = world.getDimension("overworld");
        if(!this.currentMaps.has(mapID)) {
            Logger.warn(`Map ${mapID} not found`, "MapParser");
            return;
        }
        const currentMap = this.currentMaps.get(mapID);


        for(const player of currentMap.players) {
            player.sendToHub();
            player.setHypixelValue("winsCurrency", -1);
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
        this.currentMaps.delete(mapID);
    }

    static removePlayerFromAllMaps = (player: Player) => {
        Logger.log(`Removing Player ${player.name} from all maps`, "MapParser");
        for(const map of this.currentMaps.values()) {
            MapParser.removePlayerFromMap(map.mapId, player);
        }
    }

    static removePlayerFromMap = (mapID: number, player: Player) => {
        Logger.log(`Removing Player ${player.name} from Map ${mapID}`, "MapParser");
        const currentMap = this.currentMaps.get(mapID);
        currentMap.players = currentMap.players.filter(p => p !== player);
        if(currentMap.players.length <= 1) {
            for(const player of currentMap.players) {
                player.setHypixelValue("Wins", player.getHypixelValue("Wins") + 1);
                player.setHypixelValue("winsCurrency", player.getHypixelValue("winsCurrency") + 1);
            }
            this.unlaodMap(mapID);
        }
    }
    //#endregion

    //#region Unused Functions
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
    //#endregion
}


