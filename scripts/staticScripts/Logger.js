export { Logger, LoggerClass };
class Logger {
    /**
     *
     * @param {string} str Message to log
     * @param {string | undefined}log Optional - Shows in Log
     */
    static warn(str, log = "Standard") {
        console.warn(` §l§e${log} §r- ${str}`);
    }
    static log(str, log = "Standard") {
        console.log(` §l§e${log} §r- ${str}`);
    }
}
Logger.log("Test", "Standard");
class LoggerClass {
    constructor(loggerId) {
        this.loggerId = loggerId;
    }
    log(str) {
        Logger.log(str, this.loggerId);
    }
}
