import { Command } from "./Constants";
import config from "./config.json";
import { Message, GuildMember } from "discord.js";
import LokeBot from "./LokeBot";
import moment from "moment";
import stringifyObject from "stringify-object";
import { manual } from "./Manual";

type CmdHandlerDict = { [key: string]: (msg: Message, ...args: any[]) => void };

export class CommandHandler {

	private parent: LokeBot;
	private handlers: CmdHandlerDict = {};

	constructor(parent: LokeBot) {
		this.parent = parent;
		this.initCommands();
	}

	private initCommands(): void {

		/**
		 * if additional arg is supplied: query stats for that user.
		 * @param args[0] user query 
		 */
		this.addCommand("stats", (msg, args) => {

			let tag = msg.author.tag;
			let target: GuildMember | null;

			// @param arg[0] user query.
			if (args[0] != undefined) {
				target = this.parent.queryUser(args[0]);
				if (target) tag = target.user.tag;
			}

			this.parent.dbRemote.getOneLokerStats(tag, doc => {
				if (doc && doc.meanderDays.length > 0) {
					let s = (target) ? target.displayName + "'s" : "Antall";
					s += ` registrerte lokedager: ${doc.meanderDays.length}`;
					doc.meanderDays.forEach((date, index, c) => {
						let t = moment(date).utc().utcOffset(config.utcTimezone);
						s += "\n" + t.toString();
					})
					msg.reply(s);
				} else {
					let s = (target) ? target.displayName : "Du";
					msg.reply(s + " har ingen registrerte lokedager!");
				}
			})

		});

		this.addCommand("help", (msg, args) => {

			let s: string[] = [""];
			if (args[0]) {
				let cmd = (args[0] as string).toLowerCase();
				if (manual[cmd] != undefined) {
					s[0] = manual[cmd];
				} else {
					s[0] = "/**\n * There was no command by that name in the manual. \n */";
				}
			} else {
				s = [];
				for (let cmd in manual) {
					s.push(manual[cmd]);
				}
			}

			if (msg.guild) msg.reply("Manual oppslag ble sendt som DM.");
			s.forEach((helpString, i, c) => {
				msg.author.send("```java\n" + helpString + "\n```");
			})
			
		})

		/**
		 * Debugging command. Evaluate and run javascript on the server.
		 */
		this.addCommand("eval", (msg, args) => {

			if (msg.guild != null || !this.parent.isDevAdmin(msg.author.id)) return;

			if (args) {
				let bot = this.parent; // for use in eval
				let stringify = stringifyObject; // for use in eval
				let arg = (args as string[]).join(" ");
				let result = "";
				try {
					result = eval(arg);
				} catch (e) {
					result = (e as Error).message + "\n\n" + (e as Error).stack;
				}
				console.log("EVAL OUPUT for: " + arg);
				console.log(result);
				msg.author.send("```\n" + result + "\n```");
			}

		});
		
	}

	public addCommand(cmd: string, listener: (msg: Message, ...args: any[]) => void): void {
		if (this.handlers[cmd] != undefined) {
			console.error(`That command has already been added: ${cmd}`);
			return;
		}
		this.handlers[cmd] = listener;
	}

	public forceAddCommand(cmd: string, listener: (msg: Message, ...args: any[]) => void): void {
		this.handlers[cmd] = listener;
	}

	public runCommand(cmd: string | Command, msg: Message, ...args: any[]): void {
		if (!this.handlers[cmd]) return;
		this.handlers[cmd](msg, args);
	}

	public parseCommand(msg: Message): void {
		let content = msg.content;
		content.trim();
		// ensure that command starts with prefix
		if (content.substring(0, config.prefix.length) != config.prefix) return;

		let args = content.substr(config.prefix.length).trim().replace(/ +(?= )/g, "").split(" "); // trim and remove all multiple spaces
		let cmd = args.splice(0,1)[0];
		this.runCommand(cmd, msg, ...args);
	}
	
}