import { system, world } from "@minecraft/server";
import { testMap } from "./Bridge Maps/brideMaps";
import { EGameMode, MapParser } from "./loadMap";
import { Logger } from "staticScripts/Logger";
import { AwaitFunctions } from "staticScripts/awaitFunctions";
// mapDefinitions.ts
export var EMapList;
(function (EMapList) {
    EMapList[EMapList["TEST"] = 1] = "TEST";
    // Add more maps as needed
})(EMapList || (EMapList = {}));
export const mapList = [
    {
        mapId: 1,
        mapName: "Test Map",
        gameMode: EGameMode.BRIDGE,
        mapData: testMap,
    }
];
const preloadMaps = async () => {
    for (const map of mapList) {
        Logger.warn(`Preloading Map: ${map.mapName}`);
        map.mapData.structures = await MapParser.createStructureArray(map.mapData.structureId, world.getDimension("overworld"), map.mapData.startLocation, map.mapData.endLocation);
    }
};
system.run(async () => {
    await preloadMaps();
    await AwaitFunctions.waitTicks(10);
    MapParser.loadMap(testMap, { x: 100, y: 50, z: 100 }, world.getAllPlayers());
});
