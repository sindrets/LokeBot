import { Command } from "./Constants";
import config from "./config.json";
import { Message, GuildMember } from "discord.js";
import LokeBot from "./LokeBot";
import moment from "moment";
import stringifyObject from "stringify-object";
import { manual } from "./Manual";
import { Loker, GelbooruResponseBody } from "./Interfaces";
import { TrashConveyor } from "./TrashConveyor";
import { Rules } from "./Rules";
import { Utils } from "./Utils";

type CmdHandlerDict = { [key: string]: (msg: Message, flags: Map<string,string>, ...args: any[]) => void };

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
		this.addCommand("stats", (msg, flags, args) => {

			let tag = msg.author.tag;
			let name = msg.author.username;
			let target: Loker | GuildMember | null;
			let all = flags.get("all") != undefined ? true : false;

			// @param arg[0] user query.
			if (args[0] != undefined) {
				target = this.parent.queryUsers(args[0], msg.guild);
				if (target) {
					tag = target.user.tag;
					if (target instanceof GuildMember) name = target.displayName;
					// @ts-ignore 
					else name = target.user.username;
				}
			}

			this.parent.dbRemote.getOneLokerStats(tag, doc => {

				if (doc && all) {
					let s = (target) ? name + "'s" : "Din";
					s += ` fullstendige loke-statistikk.`;
					s += "\n```";
					s += `\nRegistrerte lokedager: ${doc.meanderDays.length}`;
					s += "\n["
					doc.meanderDays.forEach((date, index, c) => {
						let t = moment(date).utc().utcOffset(config.utcTimezone);
						s += "\n  " + t.toString();
					})
					s += "\n]";
					s += "\n```";
					msg.reply(s);
				}
				else if (doc && doc.meanderDays.length > 5) {
					let s = (target) ? name + "'s" : "Antall";
					s += ` registrerte lokedager: ${doc.meanderDays.length}`;
					s += "\n Siste 5 registrerte loke-dager:"
					doc.meanderDays.some((date, index) => {
						let t = moment(date).utc().utcOffset(config.utcTimezone);
						s += "\n" + t.toString();
						return index >= 4;
					})
					s += "\n\n For fullstendig statistikk; benytt flagget `--all`.";
					msg.reply(s);
				}
				else if (doc && doc.meanderDays.length > 0) {
					let s = (target) ? name + "'s" : "Antall";
					s += ` registrerte lokedager: ${doc.meanderDays.length}`;
					doc.meanderDays.forEach((date, index, c) => {
						let t = moment(date).utc().utcOffset(config.utcTimezone);
						s += "\n" + t.toString();
					})
					msg.reply(s);
				} else {
					let s = (target) ? name : "Du";
					msg.reply(s + " har ingen registrerte lokedager!");
				}

			}, true)

		});

		this.addCommand("help", (msg, flags, args) => {

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
		this.addCommand("eval", (msg, flags, args) => {

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
				console.log(`${msg.author.tag} RAN THE EVAL COMMAND ON THE FOLLOWING STRING: ${arg}`);
				msg.author.send("```\n" + result + "\n```");
			}

		});

		this.addCommand("iamtrash", (msg, flags, args) => {

			let response: GelbooruResponseBody | null = null;
			TrashConveyor.getRandomPost(args).then(resp => {
				response = resp;

				if (response) {
					msg.reply(response.file_url);
				}
			})
			
		});

		this.addCommand("rules", (msg, flags, args) => {

			let s = " ⚖ 𝗟𝗢𝗞𝗘-𝗟𝗢𝗩 ⚖ "
				+ "\nI henhold til Loke-Lov så er alle brudd på loke-paragrafene "
				+ "straffbare. Ulike brudd kan ha ulike konsekvenser avhengig av bruddets "
				+ "alvorlighetsgrad."
			Utils.objForEach(Rules, (rule, article) => {
				s += `\n\n${article}: ${rule}`;
			});

			msg.reply(s);

		});
		
	}

	public addCommand(cmd: string, listener: (msg: Message, flags: Map<string,string>, ...args: any[]) => void): void {
		if (this.handlers[cmd] != undefined) {
			console.error(`That command has already been added: ${cmd}`);
			return;
		}
		this.handlers[cmd] = listener;
	}

	public forceAddCommand(cmd: string, listener: (msg: Message, flags: Map<string,string>, ...args: any[]) => void): void {
		this.handlers[cmd] = listener;
	}

	public runCommand(cmd: string | Command, msg: Message, flags: Map<string,string>, ...args: any[]): void {
		if (!this.handlers[cmd]) return;
		this.handlers[cmd](msg, flags, args);
	}

	public parseCommand(msg: Message): void {
		let content = msg.content;
		content.trim();
		// ensure that command starts with prefix
		if (content.substring(0, config.prefix.length) != config.prefix) return;

		let args = content.substr(config.prefix.length).trim().replace(/ +(?= )/g, "").split(" "); // trim and remove all multiple spaces
		let cmd = args.splice(0,1)[0];
		let flags = CommandHandler.parseFlags(args);
		this.runCommand(cmd, msg, flags, ...args);
	}

	public static parseFlags(args: string[]): Map<string, string> {

        let result: Map<string, string> = new Map();
        let offset = 0;
        
        args.slice(0).forEach((arg, index) => {

            if (arg.substr(0, 2) == "--") {
                let value: string = "";
                let tmp = arg.match(/\=(["'])(?:(?=(\\?))\2.)*?\1/);
                if (tmp) value = tmp[0].substring(2, tmp[0].length-1);
                else value = "true";
                result.set(arg.substring(2), value);

                args.splice(index - offset, 1);
                offset++;
            }
            else if (arg.substr(0,1) == "-") {
                let flags = arg.split("");
                flags.shift();
                flags.forEach(flag => {
                    result.set(flag, "true");
                })

                args.splice(index - offset, 1);
                offset++;
            }
            
        })

        return result;
        
    }
	
}