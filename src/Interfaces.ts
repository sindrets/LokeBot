import { Guild, GuildMember } from "discord.js";
import LokeBot from "./LokeBot";

export interface Loker {
	member: GuildMember,
	status: boolean
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

export type MemberCollection = Map<Guild, Map<string, Loker>>;