import config from "./config.json";

interface Manual {
	[key: string]: string
}

export const manual: Manual = {

	"stats": 
`stats [userQuery]
/**
 * Fetches your statistics from the database. If a user query is 
 * provided, the bot will try to find and provide stats for that user
 * instead.
 * @param userQuery?: <String> Can be a substring of a username, or
 * 		display name. The query is case insensitive.
 * @flag --all Show all stats.
 * @example ${config.prefix}stats greg
 */`,

	"help":
`help [command]
/**
 * Displays this help text. If the command parameter is provided, the
 * bot will display help for that command.
 * @param command?: <String> A command to look up in the manual.
 * @example ${config.prefix}help stats
 */`,

	"iamtrash":
`iamtrash [...tags]
/**
 * Retrieves a random post from Gelbooru with the provided tags. If no
 * tags are provided; the bot will fetch any random post.
 * @param tags?: <String> A list of tags.
 * @example ${config.prefix}iamtrash brown_hair hat
 */`,

	"rules":
`rules
/**
 * Lists all server and guild rules.
 */`,

	"owo":
`owo message
/**
 * Owoify a string.
 * @param message: <String> The string to owoify.
 * @example ${config.prefix}owo *notices buldge* !!
 */`

}