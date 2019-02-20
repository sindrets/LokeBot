import { Client, TextChannel, Guild, GuildChannel, GuildMember } from "discord.js";
import { BotEvent } from "./Constants";
import moment from "moment";
import schedule from "node-schedule";
import Long from "long";
const config = require("../src/settings.json");
const auth = require("../auth.json");

interface Loker {
	member: GuildMember,
	status: boolean
}

type MemberCollection = Map<string, Map<string, Loker>>;
type EventListenerDict = { [key: string]: Function[] };

export default class LokeBot {

	private ready: boolean = false;
	private memberDict!: MemberCollection; // Map keys should be the guild id, and member id respectively
	private eventListeners: EventListenerDict = {};
	
	public client: Client;

	constructor() {
		this.client = new Client();
	}

	public start(): void {
		
		this.client.on('ready', () => {

			console.log(`Logged in as ${this.client.user.tag}!`);
			this.populateMemberDict();

			this.ready = true;
			this.trigger(BotEvent.READY);
			
		});

		this.client.on('message', msg => {
			if (msg.content === 'ping') {
				msg.reply('pong');
			}
		});

		this.client.login(auth.TOKEN);
	}

	private populateMemberDict(): void {
		this.memberDict = new Map<string, Map<string, Loker>>();
		this.client.guilds.forEach((guild, id, collection) => {

			let resultMap: Map<string, Loker> = new Map<string, Loker>();
			guild.members.forEach((member, id, collection) => {
				if (!member.user.bot) {
					resultMap.set(id, { member: member, status: false });
				}
			});
			this.memberDict.set(id, resultMap);
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

		this.memberDict.forEach((memberMap, guildId, guildCollection) => {
			let currentGuild = this.client.guilds.get(guildId);
			if (currentGuild) {
				dict[currentGuild.name] = {};
				memberMap.forEach((loker, memberId, lokerCollection) => {
					// @ts-ignore
					dict[currentGuild.name][loker.member.user.username] = { 
						lokeStatus: loker.status, 
						id: loker.member.id 
					}
				});
			}
		});

		console.log(JSON.stringify(dict, undefined, 2));
	}

	/**
	 * Create a schedule job with a UTC invocation time.
	 * @param spec scheduling info
	 * @param utcOffset the UTC offset of the scheduled time. I.e. Norway is UTC +01:00
	 * @param callback callback to be executed on each invocation
	 */
	public scheduleUtcOffset(spec: {
		year?: number, month?: number, date?: number,
		hour?: number, minute?: number, second?: number
	}, utcOffset: number, callback: () => void) {

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

		schedule.scheduleJob(rule, callback);
	}

	/**
	 * Add an event listener.
	 * @param event Event identifier.
	 * @param listener A callback method invocated on the event trigger.
	 */
	public on(event: string | BotEvent, listener: (...args: any[]) => void): this {
		if (!this.eventListeners[event]) this.eventListeners[event] = [];
		this.eventListeners[event].push(listener);
		return this;
	}

	/**
	 * Trigger an event.
	 * @param event Event identifier.
	 * @param args Arguments passed to the listener callback.
	 */
	private trigger(event: string | BotEvent, ...args: any[]): void {
		if (!this.eventListeners[event]) return;
		this.eventListeners[event].forEach((listener, index) => {
			listener(args);
		});
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
		guild.channels.forEach(c => {
			if (c instanceof TextChannel) {
				if (c.permissionOverwrites.has(botRole.id)) {
					channel = c;
					return;
				}
			}
		});
		if (channel) return channel;

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

