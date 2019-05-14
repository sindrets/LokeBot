import getCursorPos from "get-cursor-position";
import chalk from "chalk";
import { Globals } from "Globals";

export class Logger {

    /**
     * Prints to `stdout`, only if the bot is running in debug mode.
     * @param message 
     */
    public static debug(message?: any): void {
        if (Globals.DEBUG_MODE) {
            let prefix = "";
            let pos = getCursorPos.sync();
            if ((pos && pos.col == 1) || pos === undefined) {
                prefix = chalk.yellow("DEBUGGER: ");
            }
            process.stdout.write(prefix, message);
        }
    }

    /**
     * Prints to `stdout` with newline, only if the bot is running in
     * debug mode.
     * @param message 
     * @param optionalParams 
     */
    public static debugln(message?: any, ...optionalParams: any[]): void {
        if (Globals.DEBUG_MODE) {
            let prefix = "";
            let pos = getCursorPos.sync();
            if ((pos && pos.col == 1) || pos === undefined) {
                prefix = chalk.yellow("DEBUGGER: ");
            }
            console.log(prefix, message, ...optionalParams);
        }
    }

    /**
     * Prints to `stdout`.
     * @param message 
     */
    public static print(message?: any): void {
        process.stdout.write(message);
    }

    /**
     * Prints to `stdout` with newline.
     * @param message 
     * @param optionalParams 
     */
    public static println(message?: any, ...optionalParams: any[]): void {
        console.log(message, ...optionalParams);
    }

    /**
     * Prints to `stdout` with newline.
     * @param message 
     * @param optionalParams 
     */
    public static info(message?: any, ...optionalParams: any[]): void {
        if (typeof message === "string") {
            message = chalk.blue(message);
        }
        console.log(chalk.blue("INFO: "), message, ...optionalParams);
    }

    /**
     * Prints to `stdout` with newline.
     * @param message 
     * @param optionalParams 
     */
    public static success(message?: any, ...optionalParams: any[]): void {
        if (typeof message === "string") {
            message = chalk.green(message);
        }
        console.log(message, ...optionalParams);
    }

    /**
     * Prints to `stdout` with newline.
     * @param message 
     * @param optionalParams 
     */
    public static warn(message?: any, ...optionalParams: any[]): void {
        if (typeof message === "string") {
            message = chalk.yellowBright(message);
        }
        console.log(chalk.yellowBright("WARNING: "), message, ...optionalParams);
    }

    /**
     * Prints to `stderr` with newline.
     * @param message 
     * @param optionalParams 
     */
    public static error(message?: any, ...optionalParams: any[]): void {
        if (typeof message === "string") {
            message = chalk.red(message);
        }
        else console.error(message, ...optionalParams);
    }

}