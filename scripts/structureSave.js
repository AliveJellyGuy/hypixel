import { addCommand } from "staticScripts/commandFunctions";
// Define a function to handle the ;;save command
function saveStructure(event) {
    const message = event.message;
    const regex = /;;save (\d+) (\d+) (\d+)/; // Regex pattern to match the command
    const match = message.match(regex);
    if (match) {
        const [, xStr, yStr, zStr] = match; // x, y, and z from match
        const x = parseInt(xStr);
        const y = parseInt(yStr);
        const z = parseInt(zStr);
        // Save the structure at the specified coordinates (i dont know how to make :C)
        saveStructureAtCoordinates(x, y, z);
        //feedback
        event.sender.sendMessage(`Structure saved at coordinates: (${x}, ${y}, ${z})`);
    }
    else {
        // Invalid command feedback
        event.sender.sendMessage("Invalid command format. Usage: ;;save x y z");
    }
}
//hoooow to save strucutresss teach mee
function saveStructureAtCoordinates(x, y, z) {
    // Implement saving structure logic here
    // This function will save the structure at the specified coordinates
    console.log(`Structure saved at coordinates: (${x}, ${y}, ${z})`);
}
addCommand({ commandName: "save", commandPrefix: ";;", permissions: ["admin"], directory: "saveStructure", chatFunction: (chatSendEvent) => {
        saveStructure(chatSendEvent);
    }, });
