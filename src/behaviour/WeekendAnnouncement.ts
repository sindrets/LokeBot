import config from "config.json";
import LokeBot from "LokeBot";
import { scheduleJobUtc } from "misc/ScheduleJobUtc";

export function init(bot: LokeBot) {

    // weekend announcement
	scheduleJobUtc("Weekend Announcement", "0 16 * * 5", config.timezone, () => {

		bot.guildMap.forEach((_users, guild) => {
			let channel = LokeBot.getBotChannel(guild);
			if (channel) {
				channel.send("🍻 @everyone 🍻", { file: "https://i.imgur.com/sde4YwH.png" });
			}
		});
		
	});
    
}