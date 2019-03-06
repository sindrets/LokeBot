import { Guild, GuildMember, User } from "discord.js";
import LokeBot from "./LokeBot";

export type GuildMap = Map<Guild, User[]>;
export type UserMap = Map<User, Loker>;

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

export interface GelbooruSpec {
	limit: number,
	pageNum: number,
	tags: string[]
}

export interface GelbooruResponseBody {
	source: string,
    directory: string,
    hash: string,
    height: number,
    id: number,
    image: string,
    change: number,
    owner: string,
    parent_id: number,
    rating: string,
    sample: boolean,
    sample_height: number,
    sample_width: number,
    score: number,
    tags: string,
    width: number,
    file_url: string,
    created_at: string
}