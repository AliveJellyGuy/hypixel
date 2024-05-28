import { system, world } from "@minecraft/server";
import { testMap } from "./Bridge Maps/brideMaps";
import { EGameMode, IMapData, MapParser } from "./loadMap";
import { Logger } from "staticScripts/Logger";
import { AwaitFunctions } from "staticScripts/awaitFunctions";
import { choosePlayer } from "hud";

// mapDefinitions.ts
export enum EMapList {
    TEST = 1,
    // Add more maps as needed
}

export interface IMapID{
    mapId: number
    mapName: string
    gameMode: EGameMode
    mapData: IMapData
}

export const mapList: IMapID[] = [
    {
        mapId: 1,
        mapName: "Test Map",
        gameMode: EGameMode.BRIDGE,
        mapData: testMap,
    }
];

const preloadMaps = async () => {
    for(const map of mapList) {
        Logger.warn(`Preloading Map: ${map.mapName}`)
        map.mapData.structures = await MapParser.createStructureArray(map.mapData.structureId, world.getDimension("overworld"), map.mapData.startLocation, map.mapData.endLocation)
    }
}

system.run(async () => {
    await preloadMaps()
    await AwaitFunctions.waitTicks(10)
    MapParser.loadMap(testMap, {x: 100, y: 50, z: 100}, world.getAllPlayers())
    
})

