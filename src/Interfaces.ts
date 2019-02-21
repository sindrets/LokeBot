import { Guild, GuildMember } from "discord.js";

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

export type MemberCollection = Map<Guild, Map<string, Loker>>;