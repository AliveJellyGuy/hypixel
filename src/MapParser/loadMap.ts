import { BlockPermutation, Player, Vector3, world } from "@minecraft/server"
import { Logger } from "staticScripts/Logger"
import { VectorFunctions } from "staticScripts/vectorFunctions"

enum EGameMode {
    BRIDGE
}
export interface IMapData {
    name: string,
    description: string,
    gameMode: EGameMode,
    minimumPlayerAmount: number,
    blocks: {
        blockState: number,
        blockTags: string[],
        blockType: string
        blockLcoation: Vector3
    }[]

    entities: {
        entityType: string
        entityLocation: Vector3
    }[]


    gameModeData: GameModeDataMap[EGameMode]


}

interface GameModeDataMap {
    [EGameMode.BRIDGE]: IBridgeData;
    // Add more game modes here if needed
}
interface IBridgeData {
    teams: {
        teamName: string,
        playerAmount: number,
        players: Player[],
        spawnPoints: Vector3[]
    }[]
}
class MapParser {
    static loadMap = (mapData: IMapData, offset: Vector3, players: Player[]) => {
        Logger.warn(`Loading Map: ${mapData.name}`, "MapParser");
        const dimension = world.getDimension("overworld");
        const mapDataCopy = JSON.parse(JSON.stringify(mapData)) as IMapData;


        //find free index
        let findIndex = 0;
        while (currentMaps.has(findIndex)) {
            findIndex++;
        }
        
        if(mapData.minimumPlayerAmount > players.length) {            
            for(const player of players) {
                player.sendMessage(`Not enough players to start the map! MapID: ${findIndex} Map Name: ${mapData.name}`);
            }
            Logger.log(`Not enough players to start the map! MapID: ${findIndex} Map Name: ${mapData.name}`, "MapParser");
            return;
        }
        //load blocks
        for(const block of mapDataCopy.blocks) {
            const blockPermutation = BlockPermutation.resolve(block.blockType);
            const location = VectorFunctions.addVector(block.blockLcoation, offset);
            players[0].teleport(location);
            dimension.setBlockPermutation(location, blockPermutation)
        }


        //load entities (Implementing later since no map will use this yet)

        //load game mode data
        switch(mapDataCopy.gameMode) {
            case EGameMode.BRIDGE:
                const bridgeData = mapDataCopy.gameModeData as IBridgeData;
                let currentPlayerIndex = 0;
                for(const team of bridgeData.teams) {
                    for(let i = 0; i < team.playerAmount; i++) {
                        const player = players[currentPlayerIndex];
                        player.teleport(team.spawnPoints[i]);
                       
                    }
                }
        }

        //Save the map
        currentMaps.set(findIndex, mapDataCopy);   
    }

    static unlaodMap = (mapID: number) => {
        
        currentMaps.delete(mapID);
    }
}

const currentMaps = new Map<number, IMapData>();



const testMap : IMapData = {
    name: "test",
    description: "test",
    gameMode: EGameMode.BRIDGE,
    minimumPlayerAmount: 1,
    blocks: [
        {
            blockLcoation: {x: 0, y: 0, z: 0},
            blockState: 0, 
            blockTags: [], 
            blockType: "red_terracotta"
        },
    ],
    entities: [
        
    ],
    gameModeData: {
        teams: [
            {playerAmount: 1, teamName: "test", players: [], spawnPoints:[{x: 0, y: 10, z: 0}]},
            {playerAmount: 1, teamName: "test2", players: [], spawnPoints: [{x: 0, y: 10, z: 0}]}
        ]
    }
}

MapParser.loadMap(testMap, {x: 0, y: 0, z: 0}, world.getAllPlayers())