import { Message } from "discord.js";
import fs from "fs";
import { Logger } from "Logger.js";
import path from "path";
import config from "./config.json";
import { FlagParser } from "./FlagParser.js";
import LokeBot from "./LokeBot";

type CmdHandlerDict = { [key: string]: (msg: Message, flags: FlagParser, ...args: any[]) => void };

export class CommandHandler {

	private bot: LokeBot;
	private handlers: CmdHandlerDict = {};

	constructor(parent: LokeBot) {
		this.bot = parent;
		this.initCommands();
	}

	private initCommands(): void {

		let files = fs.readdirSync(path.join(__dirname, "commands"));
		files.forEach(file => {
			require(`commands/${file}`).init(this, this.bot);
		});

	}

	/**
	 * Add a new command unless it's already defined.
	 * @param cmd 
	 * @param listener Callback function that is called when this
	 * command is triggered.
	 */
	public addCommand(cmd: string, listener: (msg: Message, flags: FlagParser, ...args: any[]) => void): void {
		if (this.handlers[cmd] != undefined) {
			Logger.error(`That command has already been added: ${cmd}`);
			return;
		}
		this.handlers[cmd] = listener;
	}

	/**
	 * Add a command regardless of whether or not it already exists. In
	 * the case that it already exists; it will be replaced.
	 * @param cmd 
	 * @param listener 
	 */
	public forceAddCommand(cmd: string, listener: (msg: Message, flags: FlagParser, ...args: any[]) => void): void {
		this.handlers[cmd] = listener;
	}

	/**
	 * Run a command with the supplied flags and args.
	 * @param cmd 
	 * @param msg 
	 * @param flags 
	 * @param args 
	 */
	public runCommand(cmd: string, msg: Message, flags: FlagParser, ...args: any[]): void {
		if (!this.handlers[cmd]) return;
		this.handlers[cmd](msg, flags, args);
	}

	/**
	 * Checks whether or not a message is a command (starts with command
	 * prefix), and parses flags and args before running the command.
	 * @param msg 
	 * @see `Config.prefix` for command prefix.
	 */
	public parseCommand(msg: Message): void {
		let content = msg.content;
		content.trim();
		// ensure that command starts with prefix
		if (content.substring(0, config.prefix.length) != config.prefix) return;

		let args = content.substr(config.prefix.length).match(/(?!\s)(?:[^"'`\s]*)(?:(["'`])(?:(?=(\\?))\2.)*?\1)?/g) || [""];
		if (args.length > 1) args.pop(); // remove empty string from regex match
		let cmd = args.splice(0, 1)[0];
		let flags = FlagParser.parse(args);
		Logger.debugln("Command parsed:");
		Logger.debugln("\tinvocator: " + msg.author.tag);
		Logger.debugln("\tcmd: " + cmd);
		Logger.debug("\tflags: "); Logger.debugln(flags);
		Logger.debug("\targs: "); Logger.debugln(args);
		this.runCommand(cmd, msg, flags, ...args);
	}

}