import { Client, TextChannel, Guild, GuildChannel, GuildMember, Role, User } from "discord.js";
import { BotEvent } from "./Constants";
import moment from "moment";
import schedule, { Job } from "node-schedule";
import Long from "long";
import config from "./config.json";
import auth from "./auth.json";
import { CommandHandler } from "./CommandHandler";
import { DbRemote } from "./DbRemote";
import { EventHandler } from "./EventHandler";
import { MemberCollection, EventListenerDict, Loker } from "./Interfaces";

export default class LokeBot {

	private ready: boolean = false;
	private memberDict!: MemberCollection; // Map keys should be the guild id, and member id respectively
	
	public client: Client;
	public dbRemote: DbRemote;
	public commandHandler!: CommandHandler;

	constructor() {
		this.client = new Client();
		this.dbRemote = new DbRemote();
		this.commandHandler = new CommandHandler(this);

		process.on('SIGINT', () => { this.shutdown() });
	}

	public start(): void {
		
		this.client.on('ready', () => {

			console.log(`Logged in as ${this.client.user.tag}!`);
			this.populateMemberDict();

			// -- INIT SCHEDULES --
			//		set all users' loke status to true, and remove Loker role every morning.
			this.scheduleJobUtc("Reset Loke-Status", { hour: parseInt(config.periodStart), minute: 0, second: 0 }, config.utcTimezone, () => {
				this.mapLokere(loker => {
					loker.status = true;
					// TODO: ensure that the Loke role exists in the guild.
					let r = this.getLokerRole(loker.member.guild);
					if (r) loker.member.removeRole(r);
				});
			});
			//		all users who are still marked as Loker at periodEnd, gets the Loker role.
			this.scheduleJobUtc("Prosecute Lokere", { hour: parseInt(config.periodEnd), minute: 0, second: 0 }, config.utcTimezone, () => {
				
				this.mapLokere(loker => {
					if (loker.status) {
						let r = this.getLokerRole(loker.member.guild);
						if (r) loker.member.addRole(r);
					}
				});

				this.memberDict.forEach((memberMap, guild, guildCollection) => {
					let lokerList: User[] = [];
					memberMap.forEach((loker, memberId, memberCollection) => {
						if (loker.status) {
							let r = this.getLokerRole(loker.member.guild);
							if (r) loker.member.addRole(r);
							lokerList.push(loker.member.user);
							this.dbRemote.addLokeDay(loker.member.user.tag);
						}
					});

					let channel = LokeBot.getBotChannel(guild);
					if (channel) {
						if (lokerList.length > 0) {
							channel.send("⚠ DAGENS LOKERE ER DØMT! ⚠");
							let s = "";
							lokerList.forEach(user => {
								s += `${user} `;
							});
							channel.send(s);
						} else {
							channel.send("Ingen lokere i dag! 🤔");
						}
					}
				})
				this.logNextInvocations();
			});

			this.logNextInvocations();

			// if a user sends a message during the judgement period; unmark them as Loker.
			this.client.on("message", msg => {
				this.commandHandler.parseCommand(msg);

				let format: string = "hh:mm";
				let t = moment().utc().utcOffset(config.utcTimezone * 60);
				let active: boolean = t.isBetween(moment(config.periodStart, format), moment(config.periodEnd, format));
				if (active) {
					let loker = this.getLokerById(msg.member.id);
					if (loker) loker.status = false;
				}
			});

			this.ready = true;
			EventHandler.trigger(BotEvent.BOT_READY);
			
		});

		this.dbRemote.connect();

		this.client.login(auth.TOKEN);
	}

	public logNextInvocations(): void {
		for (let job in schedule.scheduledJobs) {
			console.log(`Job <${job}> next invocation: ` + schedule.scheduledJobs[job].nextInvocation());
		}
	}

	private populateMemberDict(): void {
		this.memberDict = new Map<Guild, Map<string, Loker>>();
		this.client.guilds.forEach((guild, id, collection) => {

			let resultMap: Map<string, Loker> = new Map<string, Loker>();
			guild.members.forEach((member, id, collection) => {
				if (!member.user.bot) {
					resultMap.set(id, { member: member, status: false });
				}
			});
			this.memberDict.set(guild, resultMap);
		});
	}

	public prettyPrintMemberDict(): void {
		let dict: {
			[key: string]: {					//	guildName: {
				[key: string]: {				//		memberName: {
					lokeStatus: boolean,		//			
					id: string					//	
				}								//		}
			}									//	}
		} = {};

		this.memberDict.forEach((memberMap, guild, guildCollection) => {
			dict[guild.name] = {};
			memberMap.forEach((loker, memberId, lokerCollection) => {
				dict[guild.name][loker.member.user.username] = { 
					lokeStatus: loker.status, 
					id: loker.member.id 
				}
			});
		});

		console.log(JSON.stringify(dict, undefined, 2));
	}

	public mapLokere( callback: (loker: Loker) => void): void {
		this.memberDict.forEach((memberMap, guild, guildCollection) => {
			memberMap.forEach((loker, memberId, memberCollection) => {
				callback(loker);
			});
		});
	}

	private setLokeStatus(flag: boolean): void {
		this.mapLokere(loker => {
			loker.status = flag;
		});
	}

	public getMemberByTag(userTag: string): GuildMember | undefined {
		let result = undefined;
		this.mapLokere(loker => {
			if (loker.member.user.tag == userTag)
				result = loker.member;
		});
		return result;
	}

	public getLokerById(id: string): Loker | undefined {
		let result = undefined;
		this.mapLokere(loker => {
			if (loker.member.id == id)
				result = loker;
		});
		return result;
	}

	public getLokerRole(guild: Guild): Role | null {
		return guild.roles.find(role => role.name == "Loker");
	}

	public async shutdown(): Promise<void> {
		console.log("Closing connections and shutting down...");
		await this.client.destroy();
		await this.dbRemote.closeConnection();
		console.log("Successfully closed all connections!");
		process.exit(0);
	}

	/**
	 * Create a schedule job with a UTC invocation time.
	 * @param name name of the new Job
	 * @param spec scheduling info
	 * @param utcOffset the UTC offset of the scheduled time. I.e. Norway is UTC +01:00
	 * @param callback callback to be executed on each invocation
	 */
	public scheduleJobUtc(name: string, spec: {
		year?: number, month?: number, date?: number,
		hour?: number, minute?: number, second?: number
	}, utcOffset: number, callback: () => void): Job {

		let t = moment().utc();

		if (spec.year != undefined) t.set("year", spec.year);
		if (spec.month != undefined) t.set("month", spec.month - 1);
		if (spec.date != undefined) t.set("date", spec.date - 1);
		if (spec.hour != undefined) t.set("hour", spec.hour);
		if (spec.minute != undefined) t.set("minute", spec.minute);
		if (spec.second != undefined) t.set("second", spec.second);

		let currentOffset = new Date().getTimezoneOffset();
		t.utcOffset(-currentOffset - (utcOffset * 60));

		let rule = new schedule.RecurrenceRule();
		if (spec.year != undefined) rule.year = t.get("year");
		if (spec.month != undefined) rule.month = t.get("month");
		if (spec.date != undefined) rule.date = t.get("day");
		if (spec.hour != undefined) rule.hour = t.get("hour");
		if (spec.minute != undefined) rule.minute = t.get("minute");
		if (spec.second != undefined) rule.second = t.get("second");

		return schedule.scheduleJob(name, rule, callback);
	}

	public isReady(): boolean {
		return this.ready;
	}

	/**
	 * Attempts to find the most appropriate channel for the bot. The channels will be evaluated by the following 
	 * criteria in chronological order: 
	 * Channel has "LokeWatchtower" role, channel has "lokebot" in the name, first channel where bot has permission.
	 * If non of the criteria are met; returns undefined.
	 * @param guild The relevant guild
	 */
	public static getBotChannel(guild: Guild): TextChannel | undefined {
		let channel: TextChannel | undefined = undefined;

		// Look for "LokeWatchtower role on any of the channels"
		let botRole = guild.roles.find(role => role.name == "LokeWatchtower");
		if (botRole) {
			guild.channels.forEach(c => {
				if (c instanceof TextChannel) {
					if (c.permissionOverwrites.has(botRole.id)) {
						channel = c;
						return;
					}
				}
			});
			if (channel) return channel;
		}

		// Look for "lokebot" in any of the channel names
		guild.channels.forEach(c => {
			if (c instanceof TextChannel) {
				if (c.name.toLowerCase().indexOf("lokebot") != -1) {
					channel = c;
					return;
				}
			}
		});
		if (channel) return channel;

		return LokeBot.getDefaultChannel(guild) as TextChannel;
	}

	public static getDefaultChannel(guild: Guild): GuildChannel | undefined {
		// get "original" default channel
		if (guild.channels.has(guild.id))
			return guild.channels.get(guild.id)

		// Check for a "general" channel, which is often default chat
		let generalChannel = guild.channels.find(channel => channel.name === "general");
		if (generalChannel)
			return generalChannel;

		// Find first channel in order where the bot has permission to send messages
		return guild.channels
			.filter(c => {
				let permissions = c.permissionsFor(guild.client.user);
				return !!(c.type === "text" && permissions && permissions.has("SEND_MESSAGES"));
			})
			.sort((a, b) => a.position - b.position ||
				Long.fromString(a.id).sub(Long.fromString(b.id)).toNumber())
			.first();
	}

}

