import { Vector3 } from "@minecraft/server"

export interface IMapData {
    name: string
    description: string
    
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


}

class MapParser {
    static loadMap = (mapData: IMapData) => {
        
    }

    static unlaodMap = (mapData: IMapData) => {
        
    }
}

const testMap : IMapData = {
    name: "test",
    description: "test",
    blocks: [
        
    ]
}

MapParser.loadMap({blocks: [], entities: [], name: "", description: ""})