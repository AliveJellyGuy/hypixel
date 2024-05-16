var _a;
import { system } from "@minecraft/server";
export { TickFunctions };
class TickFunction {
    constructor(tickFunction, tick) {
        this.tickFunction = tickFunction;
        if (typeof tick == "undefined") {
            this.tick = 1;
        }
        else {
            this.tick = tick;
        }
    }
}
class TickFunctions {
    static tick() {
        system.runInterval(() => {
            for (const func of this.tickFunctions) {
                if (system.currentTick % func.tick == 0) {
                    func.tickFunction();
                }
            }
        }, 1);
    }
    static removeFunction(functionId) {
        this.tickFunctions.splice(functionId, 1);
    }
}
_a = TickFunctions;
TickFunctions.tickFunctions = [];
TickFunctions.addFunction = (newFunction, tick) => {
    _a.tickFunctions.push(new TickFunction(newFunction, tick));
    return _a.tickFunctions.length - 1;
};
TickFunctions.tick();
