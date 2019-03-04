import { Guild, GuildMember, User } from "discord.js";
import LokeBot from "./LokeBot";

export interface Loker {
	user: User,
	status: boolean,
	guilds: Guild[]
}

export interface LokerStatDoc {
	_id: string,
	user: string,
	meanderDays: Date[]
}

export interface EventListenerDict { 
	[key: string]: Function[] 
};

export interface IndexedLokeBot extends LokeBot {
	[key: string]: any;
}

export type GuildMap = Map<Guild, User[]>;
export type UserMap = Map<User, Loker>;