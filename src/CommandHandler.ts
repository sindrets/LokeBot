import { Command } from "./Constants";
import config from "./config.json";
import { Message } from "discord.js";
import LokeBot from "./LokeBot";
import moment = require("moment");

type CmdHandlerDict = { [key: string]: (msg: Message, ...args: any[]) => void };

export class CommandHandler {

	private parent: LokeBot;
	private handlers: CmdHandlerDict = {};

	constructor(parent: LokeBot) {
		this.parent = parent;
		this.initCommands();
	}

	private initCommands(): void {

		this.addCommand("stats", msg => {
			let tag = msg.author.tag;
			this.parent.dbRemote.getOneLokerStats(tag, doc => {
				if (doc) {
					let s = `Antall registrerte lokedager: ${doc.meanderDays.length}`;
					doc.meanderDays.forEach((date, index, c) => {
						let t = moment(date).utc().utcOffset(config.utcTimezone);
						s += "\n" + t.toString();
					})
					msg.reply(s);
				} else {
					msg.reply("Du har ingen registrerte lokedager!");
				}
			})
		});
		
	}

	public addCommand(cmd: string, listener: (msg: Message, ...args: any[]) => void): void {
		if (this.handlers[cmd] != undefined) {
			console.error(`That command has already been added: ${cmd}`);
			return;
		}
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

		let args = content.substr(config.prefix.length).split(" ");
		let cmd = args.splice(0,1)[0];
		this.runCommand(cmd, msg, args);
	}
	
}