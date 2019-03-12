import config from "./config.json";
import { Message, GuildMember } from "discord.js";
import LokeBot from "./LokeBot";
import moment from "moment";
import stringifyObject from "stringify-object";
import owofy from "owofy";
import { manual } from "./Manual";
import { Loker, GelbooruResponseBody } from "./Interfaces";
import { TrashConveyor } from "./TrashConveyor";
import { Rules } from "./Rules";
import { Utils } from "./Utils";
import { FlagParser } from "./FlagParser.js";

type CmdHandlerDict = { [key: string]: (msg: Message, flags: FlagParser, ...args: any[]) => void };

export class CommandHandler {

	private bot: LokeBot;
	private handlers: CmdHandlerDict = {};

	constructor(parent: LokeBot) {
		this.bot = parent;
		this.initCommands();
	}

	private initCommands(): void {

		/**
		 * if additional arg is supplied: query stats for that user.
		 * @param args[0] user query 
		 * @flag --all
		 */
		this.addCommand("stats", (msg, flags, args) => {

			let tag = msg.author.tag;
			let name = msg.author.username;
			let target: Loker | GuildMember | null;

			// @param arg[0] user query.
			if (args[0] != undefined) {
				target = this.bot.queryUsers(args[0], msg.guild);
				if (target) {
					tag = target.user.tag;
					if (target instanceof GuildMember) name = target.displayName;
					// @ts-ignore 
					else name = target.user.username;
				}
			}

			this.bot.dbRemote.getOneLokerStats(tag, doc => {

				if (doc && flags.isTrue("all")) {
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
					s += "\n Siste 5 registrerte loke-dager:";
					s += "\n```";
					doc.meanderDays.some((date, index) => {
						let t = moment(date).utc().utcOffset(config.utcTimezone);
						s += "\n" + t.toString();
						return index >= 4;
					})
					s += "\n```";
					s += "For fullstendig statistikk; benytt flagget `--all`.";
					msg.reply(s);
				}
				else if (doc && doc.meanderDays.length > 0) {
					let s = (target) ? name + "'s" : "Antall";
					s += ` registrerte lokedager: ${doc.meanderDays.length}`;
					s += "\n```";
					doc.meanderDays.forEach((date, index, c) => {
						let t = moment(date).utc().utcOffset(config.utcTimezone);
						s += "\n" + t.toString();
					})
					s += "\n```";
					msg.reply(s);
				} else {
					let s = (target) ? name : "Du";
					msg.reply(s + " har ingen registrerte lokedager!");
				}

			}, true)

		});

		/**
		 * @flag --here
		 */
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

			// if the "here" flag is provided: send help to current
			// channel.
			let sendHere = flags.isTrue("here");
			if (sendHere && msg.guild) {
				s.forEach((helpString, i, c) => {
					msg.channel.send("```java\n" + helpString + "\n```");
				});
				return;
			}
			else if (msg.guild) {
				msg.reply("Manual oppslag ble sendt som DM.");
			}

			s.forEach((helpString, i, c) => {
				msg.author.send("```java\n" + helpString + "\n```");
			})
			
		})

		/**
		 * Debugging command. Evaluate and run javascript on the server.
		 */
		this.addCommand("eval", (msg, flags, args) => {

			if (msg.guild != null || !this.bot.isDevAdmin(msg.author.id)) return;

			if (args) {
				let bot = this.bot; // for use in eval
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

		this.addCommand("owo", (msg, flags, args) => {

			this.bot.userSay(msg.author, owofy(args.join(" ")), {}, msg.channel);
			if (msg.deletable) {
				msg.delete();
			}
			
		})
		
	}

	/**
	 * Add a new command unless it's already defined.
	 * @param cmd 
	 * @param listener Callback function that is called when this
	 * command is triggered.
	 */
	public addCommand(cmd: string, listener: (msg: Message, flags: FlagParser, ...args: any[]) => void): void {
		if (this.handlers[cmd] != undefined) {
			console.error(`That command has already been added: ${cmd}`);
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

		let args = content.substr(config.prefix.length).match(/(?!\s)([^"'\s]*)(=?(["'])(?:(?=(\\?))\4.)*?\3)?/g) || [""];
		if (args.length > 1) args.pop(); // remove empty string from regex match
		let cmd = args.splice(0,1)[0];
		let flags = FlagParser.parseFlags(args);
		// console.log("cmd: " + cmd);
		// console.log(flags);
		// console.log(args);
		this.runCommand(cmd, msg, flags, ...args);
	}
	
}