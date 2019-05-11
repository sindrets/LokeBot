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
            let pos = getCursorPos.sync();
            if ((pos && pos.col == 1) || pos === undefined) {
                process.stdout.write(chalk.yellow("DEBUGGER: "));
            }
            process.stdout.write(message);
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
            let pos = getCursorPos.sync();
            if ((pos && pos.col == 1) || pos === undefined) {
                process.stdout.write(chalk.yellow("DEBUGGER: "));
            }
            console.log(message, ...optionalParams);
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
        process.stdout.write(chalk.blue("INFO: "));
        console.log(message, ...optionalParams);
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
        process.stdout.write(chalk.yellowBright("WARNING: "));
        console.log(message, ...optionalParams);
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