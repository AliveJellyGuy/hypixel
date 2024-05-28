import { bridgeSpawn } from "Bridge/bridge";
import { EGameMode } from "MapParser/loadMap";
const redKitChestLocation = { x: 3, y: 57, z: -33 };
const blueKitChestLocation = { x: 7, y: 57, z: -33 };
//const red_kit=new Kit(redKitChestLocation)
//const blue_kit=new Kit(blueKitChestLocation)
export const testMap = {
    name: "test",
    description: "test",
    gameMode: EGameMode.BRIDGE,
    minimumPlayerAmount: 1,
    players: [],
    startLocation: { x: -1047, y: 84, z: -1027 },
    endLocation: { x: -965, y: 116, z: -1000 },
    structureId: "mystructure:test",
    structures: [],
    tickFunctionId: -1,
    mapId: -1,
    playerSpawnFunction: bridgeSpawn,
    entities: [],
    gameModeData: {
        winsNeeded: 3,
        blockPlaceArea: {
            start: { x: 18, y: -1, z: 9 },
            end: { x: 63, y: 18, z: 21 }
        },
        teams: [
            {
                playerAmount: 1,
                teamKitLocation: blueKitChestLocation,
                teamScore: 0,
                teamName: "§9BLUE",
                players: [],
                spawnPoints: [{ x: 10, y: 21, z: 15 }],
                capturePoints: [{ startPosition: { x: 11, y: 8, z: 17 }, endPosition: { x: 7, y: 8, z: 13 } }],
                spawnBarrierBlockTypeID: "glass",
                spawnBarriers: [{ startPosition: { x: 9, y: 20, z: 13 }, endPosition: { x: 11, y: 20, z: 17 } }]
            },
            {
                playerAmount: 2,
                teamKitLocation: redKitChestLocation,
                teamScore: 0,
                teamName: "§4RED",
                players: [],
                spawnPoints: [{ x: 73, y: 21, z: 15 }],
                capturePoints: [{ startPosition: { x: 75, y: 8, z: 17 }, endPosition: { x: 71, y: 8, z: 13 } }],
                spawnBarrierBlockTypeID: "glass",
                spawnBarriers: [{ startPosition: { x: 71, y: 20, z: 13 }, endPosition: { x: 73, y: 20, z: 17 } }]
            },
        ]
    }
};
