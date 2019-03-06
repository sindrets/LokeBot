import { Client, TextChannel, Guild, GuildChannel, GuildMember, Role, User } from "discord.js";
import { BotEvent } from "./Constants";
import moment from "moment";
import schedule, { Job } from "node-schedule";
import Long from "long";
import auth from "./auth.json";
import { CommandHandler } from "./CommandHandler";
import { DbRemote } from "./DbRemote";
import { EventHandler } from "./EventHandler";
import { GuildMap, Loker, UserMap } from "./Interfaces";
import { initBehaviour } from "./Behaviour";

export default class LokeBot {

	private ready: boolean = false;
	
	public guildMap!: GuildMap;
	public userMap!: UserMap;
	public client: Client;
	public dbRemote: DbRemote;
	public commandHandler: CommandHandler;

	constructor() {

		this.client = new Client();
		this.dbRemote = new DbRemote();
		this.commandHandler = new CommandHandler(this);

		process.on("SIGINT", () => { this.shutdown() });
		process.on("SIGABRT", () => { this.shutdown() });

	}

	public start(): void {
		
		this.client.on('ready', () => {

			console.log(`Logged in as ${this.client.user.tag}!`);
			
			this.populateGuildMap();
			this.populateUserMap();
			initBehaviour(this);
			this.logNextInvocations();

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

	private populateGuildMap(): void {

		this.guildMap = new Map<Guild, User[]>();

		this.client.guilds.forEach((guild) => {

			let userList: User[] = [];
			guild.members.forEach((member) => {
				if (!member.user.bot) {
					userList.push(member.user);
				}
			});
			this.guildMap.set(guild, userList);

		});

	}

	private populateUserMap(): void {

		this.userMap = new Map<User, Loker>();

		this.client.guilds.forEach((guild) => {
			guild.members.forEach((member) => {
				if (!member.user.bot) {
					let loker = this.userMap.get(member.user);
					if (loker == undefined) {
						this.userMap.set(member.user, {user: member.user, status: false, guilds: [guild]});
					} else {
						loker.guilds.push(guild);
					}
				}
			})
		});
		
	}

	/**
	 * Pretty print the guild map.
	 */
	public ppGuildMap(log=false): string {

		let dict: { [key: string]: string[] } = {};

		this.guildMap.forEach((memberList, guild) => {
			
			dict[guild.name] = [];

			memberList.forEach((user) => {
				dict[guild.name].push(user.tag);
			});
		});

		let s = JSON.stringify(dict, undefined, 2);
		if (log) console.log(s);

		return s;

	}

	/**
	 * Pretty print the user map.
	 */
	public ppUserMap(log=false): string {

		let dict: { 
			[key: string]: {
				status: boolean,
				guilds: string[]
			}
		} = {};

		this.userMap.forEach((loker, user) => {
			dict[user.tag] = {
				status: loker.status,
				guilds: []
			};
			loker.guilds.forEach((guild) => {
				dict[user.tag].guilds.push(guild.name);
			});
		});

		let s = JSON.stringify(dict, undefined, 2);
		if (log) console.log(s);

		return s;
		
	}

	/**
	 * Iterate over all Lokere from all guilds. 
	 * @param callback If the callback returns `true`, the remaining iterations are skipped.
	 */
	public iterateLokere( callback: (loker: Loker) => boolean | void): void {

		let stop = false;

		this.userMap.forEach(loker => {
			if (!stop) {
				stop = !!callback(loker);
			}
		})

	}

	/**
	 * Returns an array of GuildMember objects for every Guild this user is member of
	 * @param user 
	 */
	public getMemberships(user: User): GuildMember[] {

		let result: GuildMember[] = [];

		this.guildMap.forEach((users, guild) => {
			let member = guild.members.get(user.id)
			if (member) result.push(member);
		})

		return result;
		
	}

	/**
	 * Set loke status of all users. The status is evaluated every day at `config.periodEnd`
	 * @param flag 
	 */
	public setLokeStatus(flag: boolean): void {

		this.iterateLokere(loker => {
			loker.status = flag;
		});

	}

	/**
	 * Override loke status of specific users.
	 * @param conf An object with user queries as keys, and booleans as values
	 * @param strict Whether or not the query should be strict 
	 * @see LokeBot.queryUsers for details on how user queries work.
	 */
	public overrideStatus(conf: {[key:string]: boolean}, strict=false): void {

		let entries = Object.entries(conf);
		entries.forEach(pair => {
			let loker = this.queryUsers(pair[0], strict);
			if (loker) loker.status = pair[1];
		})

	}

	/**
	 * Query a user by its id.
	 * @param id User id
	 */
	public getLokerById(id: string): Loker | null {

		let result = null;
		this.iterateLokere(loker => {
			if (loker.user.id == id)
				result = loker;
		});
		return result;

	}

	/**
	 * Find and return the "Loker" role in the provided guild. Create it if it's not found.
	 * @param guild 
	 */
	public async getLokerRole(guild: Guild): Promise<Role> {

		let role = guild.roles.find(role => role.name == "Loker");
		
		if (role === null) {
			await guild.createRole({ name: "Loker", color: "BLUE" }).then(r => {
				role = r;
			});
		}
		return role;

	}

	/**
	 * Query all users by username, or nickname and return a user if a match is found.
	 * @param query A string that partially matches the username, or nickname (can be nickname from any server LokeBot is member)
	 * @param guild The guild to be queried
	 * @param strict If strict: query must be an exact, case-sensitive match of either username, or nickname
	 */
	public queryUsers(query: string, strict?: boolean): Loker | null;
	public queryUsers(query: string, guild: Guild, strict?: boolean): GuildMember | null;
	public queryUsers(query: string, strictOrGuild?: boolean | Guild, strict=false): Loker | GuildMember | null {

		let result: Loker | GuildMember | null = null;
		let strictFlag: boolean = strict;

		let match = (member: GuildMember): boolean => {
			if (!strictFlag) {
				if (member.nickname && member.nickname.toLowerCase().indexOf(query.toLowerCase()) != -1) {
					return true;
				}
				else if (member.user.username.toLowerCase().indexOf(query.toLowerCase()) != -1) {
					return true;
				}
			} else {
				if (member.nickname == query) {
					return true;
				}
				else if (member.user.username == query) {
					return true;
				}
			}

			return false;
		}

		if (strictOrGuild == undefined || typeof strictOrGuild === "boolean") {

			strictFlag = strictOrGuild || strict;

			this.iterateLokere(loker => {
				let memberships = this.getMemberships(loker.user);
				let stop = false;
				memberships.some(member => {
					if (match(member)) {
						result = loker;
						stop = true;
					}
					return stop;
				})
				return stop;
			})

		}
		// guild was provided
		else if (strictOrGuild instanceof Guild) {
			strictOrGuild.members.some(member => {
				let stop = false;
				if (match(member)) {
					result = member;
					stop = true;
				}
				return stop;
			})
		}

		return result;

	}

	/**
	 * 
	 * @param query A string that partially matches the guild name
	 * @param strict If strict: query must be an exact match
	 */
	public queryGuilds(query: string, strict=false): Guild | null {

		let result: Guild | null = null;

		this.guildMap.forEach((lokerMap, guild) => {
			if (!strict) {
				if (guild.name.toLowerCase().indexOf(query.toLowerCase()) != -1)
					result = guild;
			} else {
				if (guild.name == query)
					result = guild;
			}
		})

		return result;

	}

	/**
	 * Returns true if the users ID is registered as a dev admin.
	 * @param user either a user id string, or a `User` object.
	 */
	public isDevAdmin(user: string | User): boolean {

		let result = false;
		let uid = "";
		if (user instanceof User) uid = user.id;
		else uid = user;

		auth.DEV_ADMINS.forEach((id) => {
			if (uid == id) {
				result = true;
				return;
			}
		});

		return result;

	}

	/**
	 * Close all connections and exit
	 */
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

