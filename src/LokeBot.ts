import { Client, TextChannel, Guild, GuildChannel } from "discord.js";
import * as Long from "long";
const config = require("../src/settings.json");
const auth = require("../auth.json");

interface Loker {
	id: string
}

export default class LokeBot {

	private client: Client;
	private lokeList: Loker[] = [];

	constructor() {
		this.client = new Client();
	}

	public start(): void {
		this.client.on('ready', () => {
			console.log(`Logged in as ${this.client.user.tag}!`);
			console.log("\n\n\n---MEMBERS---");
			console.log(this.client.guilds.array()[0].members);
			console.log("\n\n\n---CHANNELS---");
			this.client.guilds.array()[0].channels.forEach((c) => {
				console.log(c);
			});
			console.log("\n\n\n");
			console.log(LokeBot.getBotChannel(this.client.guilds.array()[0]));
		});

		this.client.on('message', msg => {
			if (msg.content === 'ping') {
				msg.reply('pong');
			}
		});

		this.client.login(auth.token);
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
				Long.default.fromString(a.id).sub(Long.default.fromString(b.id)).toNumber())
			.first();
	}

}

