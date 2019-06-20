import chalk from "chalk";
import { Globals } from "./Globals";

export class Logger {

    public static enabled: boolean = true;

    private static posIsZero: boolean = true;

    private static updatePos(message: any) {
        if (typeof message !== "string" || message[message.length-1] != "\n") {
            Logger.posIsZero = false;
        }
        else Logger.posIsZero = true;
    }

    /**
     * Prints to `stdout`, only if the bot is running in debug mode.
     * @param message 
     */
    public static debug(message?: any): void {
        if (Logger.enabled && Globals.DEBUG_MODE) {
            let prefix = "";
            if (Logger.posIsZero) {
                prefix = chalk.yellow("DEBUGGER: ");
            }
            process.stdout.write(prefix);
            process.stdout.write(message);
            Logger.updatePos(message);
        }
    }

    /**
     * Prints to `stdout` with newline, only if the bot is running in
     * debug mode.
     * @param message 
     * @param optionalParams 
     */
    public static debugln(message?: any, ...optionalParams: any[]): void {
        if (Logger.enabled && Globals.DEBUG_MODE) {
            let prefix = "";
            if (Logger.posIsZero) {
                prefix = chalk.yellow("DEBUGGER: ");
            }
            console.log(prefix, message, ...optionalParams);
            Logger.posIsZero = true;
        }
    }

    /**
     * Prints to `stdout`.
     * @param message 
     */
    public static print(message?: any): void {
        if (Logger.enabled) {
            process.stdout.write(message);
            Logger.updatePos(message);
        }
    }

    /**
     * Prints to `stdout` with newline.
     * @param message 
     * @param optionalParams 
     */
    public static println(message?: any, ...optionalParams: any[]): void {
        if (Logger.enabled) {
            console.log(message, ...optionalParams);
            Logger.posIsZero = true;
        }
    }

    /**
     * Prints to `stdout` with newline.
     * @param message 
     * @param optionalParams 
     */
    public static info(message?: any, ...optionalParams: any[]): void {
        if (Logger.enabled) {
            if (typeof message === "string") {
                message = chalk.blue(message);
            }
            console.log(chalk.blue("INFO: "), message, ...optionalParams);
            Logger.posIsZero = true;
        }
    }

    /**
     * Prints to `stdout` with newline.
     * @param message 
     * @param optionalParams 
     */
    public static success(message?: any, ...optionalParams: any[]): void {
        if (Logger.enabled) {
            if (typeof message === "string") {
                message = chalk.green(message);
            }
            console.log(message, ...optionalParams);
            Logger.posIsZero = true;
        }
    }

    /**
     * Prints to `stdout` with newline.
     * @param message 
     * @param optionalParams 
     */
    public static warn(message?: any, ...optionalParams: any[]): void {
        if (Logger.enabled) {
            if (typeof message === "string") {
                message = chalk.yellowBright(message);
            }
            console.log(chalk.yellowBright("WARNING: "), message, ...optionalParams);
            Logger.posIsZero = true;
        }
    }

    /**
     * Prints to `stderr` with newline.
     * @param message 
     * @param optionalParams 
     */
    public static error(message?: any, ...optionalParams: any[]): void {
        if (Logger.enabled) {
            if (typeof message === "string") {
                message = chalk.red(message);
            }
            else console.error(chalk.red("ERROR: "), message, ...optionalParams);
            Logger.posIsZero = true;
        }
    }

}