import chalk from "chalk";
import { closeSync, createWriteStream, existsSync, openSync } from "fs";
import { Globals } from "./Globals";

interface StdOptions {
	fileSystemFlags?: string
	chalkLevel?: number
}

export class Logger {
	public static enabled: boolean = true;

	private static stdout: NodeJS.WritableStream = process.stdout;
	private static stderr: NodeJS.WritableStream = process.stderr;
	private static c = Logger.setupConsole();
	private static ctx = new chalk.constructor();
	private static posIsZero: boolean = true;

	private static setupConsole(): Console {
		return new console.Console(Logger.stdout, Logger.stderr);
	}

	private static updatePos(message: any) {
		if (typeof message !== "string" || message[message.length - 1] != "\n") {
			Logger.posIsZero = false;
		} else Logger.posIsZero = true;
	}

	/**
	 * Prints to `stdout`, only if the bot is running in debug mode.
	 * @param message
	 */
	public static debug(message?: any): void {
		if (Logger.enabled && Globals.DEBUG_MODE) {
			let prefix = "";
			if (Logger.posIsZero) {
				prefix = Logger.ctx.yellow("DEBUGGER: ");
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
				prefix = Logger.ctx.yellow("DEBUGGER: ");
			}
			Logger.c.log(prefix, message, ...optionalParams);
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
			Logger.c.log(message, ...optionalParams);
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
				message = Logger.ctx.blue(message);
			}
			Logger.c.log(Logger.ctx.blue("INFO: "), message, ...optionalParams);
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
				message = Logger.ctx.green(message);
			}
			Logger.c.log(message, ...optionalParams);
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
				message = Logger.ctx.yellowBright(message);
			}
			Logger.c.log(Logger.ctx.yellowBright("WARNING: "), message, ...optionalParams);
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
				message = Logger.ctx.red(message);
			} else Logger.c.error(Logger.ctx.red("ERROR: "), message, ...optionalParams);
			Logger.posIsZero = true;
		}
	}

	public static setChalkLevel(level: number): void {
		Logger.ctx.level = level;
	}

	/**
	 * Change the logger's stdout. Does not affect process stdout.
	 * @param path The path to a writeable file, to be used as stdout.
	 */
	public static setStdout(path: string, opts?: StdOptions): void;
	/**
	 * Change the logger's stdout. Does not affect process stdout.
	 * @param writeStream A writestream to be used as stdout.
	 */
	public static setStdout(writeStream: NodeJS.WritableStream, opts?: StdOptions): void;
	public static setStdout(streamOrPath: NodeJS.WritableStream | string, opts: StdOptions = {fileSystemFlags: "w"}): void {
		if (typeof streamOrPath != "string") {
			Logger.stdout = streamOrPath;
			Logger.c = Logger.setupConsole();
			return;
		}

		if (opts.fileSystemFlags === undefined) {
			opts.fileSystemFlags = "w";
		}
		if (opts.chalkLevel !== undefined) {
			Logger.ctx.level = opts.chalkLevel;
		}

		let path = streamOrPath;
		if (!existsSync(path)) {
			try {
				closeSync(openSync(path, "w"));
			} catch (e) {
				Logger.error(e);
				throw new Error("Could not touch file!");
			}
		}

		try {
			Logger.stdout = createWriteStream(path, { flags: opts.fileSystemFlags });
		} catch (e) {
			Logger.error(e);
			throw new Error("Could not create write stream!");
		}

		Logger.c = Logger.setupConsole();
	}

	/**
	 * Change the logger's stderr. Does not affect process stderr.
	 * @param path The path to a writeable file, to be used as stderr.
	 */
	public static setStderr(path: string, opts?: StdOptions): void;
	/**
	 * Change the logger's stderr. Does not affect process stderr.
	 * @param writeStream A writestream to be used as stderr.
	 */
	public static setStderr(writeStream: NodeJS.WritableStream, opts?: StdOptions): void;
	public static setStderr(streamOrPath: NodeJS.WritableStream | string, opts: StdOptions = {fileSystemFlags: "w"}): void {
		if (typeof streamOrPath != "string") {
			Logger.stderr = streamOrPath;
			Logger.c = Logger.setupConsole();
			return;
		}

		if (opts.fileSystemFlags === undefined) {
			opts.fileSystemFlags = "w";
		}
		if (opts.chalkLevel !== undefined) {
			Logger.ctx.level = opts.chalkLevel;
		}

		let path = streamOrPath;
		if (!existsSync(path)) {
			try {
				closeSync(openSync(path, "w"));
			} catch (e) {
				Logger.error(e);
				throw new Error("Could not touch file!");
			}
		}

		try {
			Logger.stdout = createWriteStream(path, { flags: opts.fileSystemFlags });
		} catch (e) {
			Logger.error(e);
			throw new Error("Could not create write stream!");
		}

		Logger.c = Logger.setupConsole();
	}
}
