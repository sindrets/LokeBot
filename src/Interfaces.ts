import { Guild, User } from "discord.js";
import { CommandHandler } from "CommandHandler";
import LokeBot from "LokeBot";

export type GuildMap = Map<Guild, User[]>;
export type UserMap = Map<User, Loker>;

export type CmdInitializer = (ch: CommandHandler, bot: LokeBot) => void;

export interface Loker {
	user: User,
	status: boolean,
	guilds: Guild[]
}

export interface LokerStatDoc {
    _id?: string,
    /**
     * Discord user id.
     */
    uid: string,
    /**
     * Discord user tag.
     */
    user: string,
    /** 
     * Determines whether or not this user is a Loker. Its value is
     * evaluated on Config.periodEnd each day. 
     */
    state: boolean,
    /**
     * An array of all registered loke-days. 
     */
	meanderDays: Date[]
}

export interface ExceptionDoc {
    _id?: string,
    name: string,
    periodStart: Date,
    periodEnd: Date
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

export interface CronFields {
    second: number[],
    minute: number[],
    hour: number[],
    dayOfMonth: number[],
    month: number[],
    dayOfWeek: number[]
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