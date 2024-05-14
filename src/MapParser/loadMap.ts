import { BlockPermutation, Player, Vector3, world } from "@minecraft/server"
import { IBridgeData, blue_kit, bridgeNextRound, bridgeTick, red_kit } from "Bridge/bridge"
import { Logger } from "staticScripts/Logger"
import { TickFunctions } from "staticScripts/tickFunctions"
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
            block.blockLcoation = VectorFunctions.addVector(block.blockLcoation, offset);	
            players[0].teleport(block.blockLcoation);
            dimension.setBlockPermutation(block.blockLcoation, blockPermutation)
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
                        team.players.push(player);
                        player.teleport(team.spawnPoints[i % team.spawnPoints.length]);
                       
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

                TickFunctions.addFunction(bridgeTick.bind(this, mapDataCopy), 5)
                bridgeNextRound(mapDataCopy)
        }

        //Save the map
        currentMaps.set(findIndex, mapDataCopy);   
    }

    static unlaodMap = (mapID: number) => {
        const overworld = world.getDimension("overworld");
        //overworld.fillBlocks()
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
            {
                playerAmount: 1,
                teamKit: red_kit,
                teamScore: 0,
                teamName: "test",
                players: [], 
                spawnPoints:[{x: 0, y: 10, z: 0}],
                capturePoints: [{startPosition: {x: -3, y: 10, z: -3}, endPosition: {x: 3, y: 10, z: 3}}],
                spawnBarrierBlockTypeID: "grass_block",
                spawnBarriers: [{startPosition: {x: -3, y: 10, z: -3}, endPosition: {x: 3, y: 10, z: 3}}]
            },
            {
                playerAmount: 1,
                teamKit: blue_kit,
                teamScore: 0,
                teamName: "test2",
                players: [], 
                spawnPoints:[{x: 0, y: 11, z: 0}],
                capturePoints: [{startPosition: {x: -3, y: 10, z: -3}, endPosition: {x: 3, y: 10, z: 3}}],
                spawnBarrierBlockTypeID: "stone",
                spawnBarriers: [{startPosition: {x: 0, y: 10, z: 0}, endPosition: {x: 0, y: 10, z: 0}}]
            },
        ]
    }
}

MapParser.loadMap(testMap, {x: 0, y: -20, z: 0}, world.getAllPlayers())