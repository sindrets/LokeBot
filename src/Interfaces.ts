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
    /**
     * Discord user tag.
     */
    user: string,
    /**
     * An array of all registered loke-days. 
     */
	meanderDays: Date[]
}

export interface LokerStateDoc {
    _id: string,
    /**
     * Discord user tag.
     */
    user: string,
    /** 
     * Determines whether or not this user is a Loker. Its value is
     * evaluated on Config.periodEnd each day. 
     */
    state: boolean
}

export type EventListener = {
    requirements: string[],
    callback: Function
}

export interface EventListenerDict { 
	[key: string]: EventListener[]
};

export interface OnceEventListenerDict {
    [key: string]: undefined | {
        done: boolean,
        args: any[],
        listeners: EventListener[]
    }
}

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