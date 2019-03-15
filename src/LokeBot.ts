import { Client, DMChannel, GroupDMChannel, Guild, GuildChannel, GuildMember, RichEmbed, Role, StringResolvable, TextChannel, User } from "discord.js";
import Long from "long";
import moment from "moment";
import schedule, { Job } from "node-schedule";
import auth from "./auth.json";
import { initBehaviour } from "./Behaviour";
import { CommandHandler } from "./CommandHandler";
import { BotEvent } from "./Constants";
import { DbRemote } from "./DbRemote";
import { EventHandler } from "./EventHandler";
import { GuildMap, Loker, UserMap } from "./Interfaces";
import { RuleEnforcer } from "./RuleEnforcer";

export default class LokeBot {

	private ready: boolean = false;
	
	/**
	 * A map where all the guilds the bot is member of is paired with
	 * an array of its users.
	 */
	public guildMap!: GuildMap;
	/**
	 * A map where all unique users from all the guilds the bot is
	 * member of, is paired with each respective user's [[Loker]]
	 * object. 
	 */
	public userMap!: UserMap;

	public client: Client;
	public dbRemote: DbRemote;
	public commandHandler: CommandHandler;
	public ruleEnforcer: RuleEnforcer;

	constructor() {

		this.client = new Client();
		this.dbRemote = new DbRemote();
		this.commandHandler = new CommandHandler(this);
		this.ruleEnforcer = new RuleEnforcer();

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
			EventHandler.trigger(BotEvent.BOT_READY, true);
			
		});

		// triggered when LokeBot joins a guild
		this.client.on("guildCreate", guild => {
			this.addGuild(guild);
			this.addGuildMembers(guild);
		});

		// triggered when LokeBot is kicked from a guild
		this.client.on("guildDelete", guild => {
			this.removeGuild(guild);
		});

		// triggered when a member joins a guild where LokeBot is also a
		// member
		this.client.on("guildMemberAdd", member => {
			this.addMember(member);
		});

		// triggered when a member leaves a guild where LokeBot is also
		// a member
		this.client.on("guildMemberRemove", member => {
			this.removeMember(member);
		});

		this.client.on("error", err => {
			console.error(err);
		});

		this.dbRemote.connect();

		this.client.login(auth.TOKEN);

	}

	public logNextInvocations(): void {

		for (let job in schedule.scheduledJobs) {
			console.log(`Job <${job}> next invocation: ` + schedule.scheduledJobs[job].nextInvocation());
		}

	}

	/**
	 * Adds a new guild to the guild map.
	 * @param guild 
	 */
	private addGuild(guild: Guild): void {

		if (this.guildMap) {

			let userList: User[] = [];
			guild.members.forEach((member) => {
				if (!member.user.bot) {
					userList.push(member.user);
				}
			});
			this.guildMap.set(guild, userList);
			
		}
		
	}

	/**
	 * Removes a guild from the guild map and any references it may have
	 * in the user map.
	 * @param guild 
	 */
	private removeGuild(guild: Guild) {

		if (this.guildMap) {
			this.guildMap.delete(guild);
		}

		if (this.userMap) {

			guild.members.forEach(member => {
				let loker = this.userMap.get(member.user);
				if (loker) {
					let i = loker.guilds.indexOf(guild);
					if (i != -1) loker.guilds.splice(i, 1);
				}
			})
			
		}
		
	}

	/**
	 * Adds a guild to this user's list of guilds in the user map. If
	 * it's a new user: add the user to the user map.
	 * @param member 
	 */
	private addMember(member: GuildMember): void {

		if (this.userMap) {

			if (!member.user.bot) {
				let loker = this.userMap.get(member.user);
				if (loker == undefined) {
					this.userMap.set(member.user, {user: member.user, status: false, guilds: [member.guild]});
				} else {
					loker.guilds.push(member.guild);
				}
			}
			
		}
		
	}

	/**
	 * Removes a guild from this user's list of guilds in the user map.
	 * If the list is empty after this operation: the user is deleted
	 * from the user map.
	 * @param member 
	 */
	private removeMember(member: GuildMember): void {

		if (this.userMap) {

			let loker = this.userMap.get(member.user);
			if (loker) {
				let i = loker.guilds.indexOf(member.guild);
				if (i != -1) loker.guilds.splice(i, 1);
				
				if (loker.guilds.length == 0)
					this.userMap.delete(member.user);
			}
			
		}

		if (this.guildMap) {

			let userList = this.guildMap.get(member.guild);
			if (userList) {
				let i = userList.indexOf(member.user);
				if (i != -1) userList.splice(i, 1);
			}
			
		}
		
	}

	/**
	 * Add all members of a guild to the user map.
	 * @param guild The guild whose members to add
	 */
	private addGuildMembers(guild: Guild): void {

		guild.members.forEach(member => {
			this.addMember(member);
		});
		
	}

	/**
	 * Initialize the guild map.
	 */
	private populateGuildMap(): void {

		this.guildMap = new Map();

		this.client.guilds.forEach((guild) => {
			this.addGuild(guild);
		});

	}

	/**
	 * Initialize the user map.
	 */
	private populateUserMap(): void {

		this.userMap = new Map();

		this.client.guilds.forEach((guild) => {
			this.addGuildMembers(guild);
		});
		
	}

	/**
	 * Pretty print the guild map.
	 * @param log Log output to console
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
	 * @param log Log output to console
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
	 * Pretty print a list of users or guild members. 
	 * @param list 
	 * @param log log output to the console
	 */
	public ppUserList(list: User[] | GuildMember[], log=false): string {

		let temp: any[] = [];

		if (list[0] instanceof GuildMember) {
			(list as GuildMember[]).forEach(member => {
				temp.push(member.user.tag);
			})
		} else {
			(list as User[]).forEach(user => {
				temp.push(user.tag);
			})
		}

		let s = JSON.stringify(temp, undefined, 2);
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
	 * @see [[LokeBot.queryUsers]] for details on how user queries work.
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
	 * Find and return the "Rutta-gutta" role in the provided guild. Create it if it's not found.
	 * @param guild 
	 */
	public async getRuttaRole(guild: Guild): Promise<Role> {

		let role = guild.roles.find(role => role.name == "Rutta-gutta");
		
		if (role === null) {
			await guild.createRole({ name: "Rutta-gutta", color: "LUMINOUS_VIVID_PINK" }).then(r => {
				role = r;
			});
		}
		return role;

	}

	/**
	 * Send a message in place of another user in the form of a rich
	 * embed.
	 * @param user 
	 * @param embedContent 
	 * @param messageContent 
	 * @param channel 
	 */
	public userSay(user: User, embedContent: StringResolvable, messageContent="", channel?: TextChannel | DMChannel | GroupDMChannel): void {

		let displayName = user.username;
		if (channel && channel instanceof TextChannel) {
			let member = this.queryUsers(user.tag, channel.guild, true);
			if (member) displayName = member.displayName;
		}
		
		let embed = new RichEmbed({
			description: embedContent,
			color: parseInt("E64F25", 16),
			author: {
				name: `${displayName} says:`,
				icon_url: user.avatarURL
			}
		})
		
		if (channel) channel.send(messageContent, { embed: embed });
		else user.send(messageContent, { embed: embed });
		
	}

	/**
	 * Query all users by user tag, or nickname and return a user if a
	 * match is found.
	 * @param query A string that partially matches the user tag, or
	 * nickname (can be nickname from any guild LokeBot is member)
	 * @param strict If strict: query must be an exact, case-sensitive
	 * match of either user tag, or nickname
	 */
	public queryUsers(query: string, strict?: boolean): Loker | null;
	/**
	 * Query all users of a specified guild by user tag, or nickname and
	 * return a user if a match is found.
	 * @param query A string that partially matches the user tag, or
	 * nickname (the nickname used in the specified guild).
	 * @param guild The guild to be queried
	 * @param strict If strict: query must be an exact, case-sensitive
	 * match of either user tag, or nickname
	 */
	public queryUsers(query: string, guild: Guild, strict?: boolean): GuildMember | null;
	public queryUsers(query: string, strictOrGuild?: boolean | Guild, strict=false): Loker | GuildMember | null {

		let result: Loker | GuildMember | null = null;
		let strictFlag: boolean = strict;

		let match = (member: GuildMember): boolean => {
			if (!strictFlag) {
				if (member.nickname && member.nickname.toLowerCase().indexOf(query.toLowerCase()) != -1) {
					return true;
				}
				else if (member.user.tag.toLowerCase().indexOf(query.toLowerCase()) != -1) {
					return true;
				}
			} else {
				if (member.nickname == query) {
					return true;
				}
				else if (member.user.tag == query) {
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
				if (match(member)) {
					result = member;
					return true;
				}
				return false;
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

