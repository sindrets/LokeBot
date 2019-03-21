import config from "config.json";
import LokeBot from "LokeBot";
import moment = require("moment");

export function init(bot: LokeBot) {

    // weekend announcement
	bot.scheduleJobUtc("Weekend Announcement", { hour: 16, minute: 0, second: 0 }, config.utcTimezone, () => {
		
		let now = moment.utc().isoWeekday();
		if (now == 5) {

			bot.guildMap.forEach((users, guild) => {
				let channel = LokeBot.getBotChannel(guild);
				if (channel) {
					channel.send("🍻 @everyone 🍻", { file: "https://i.imgur.com/sde4YwH.png" });
				}
			})
			
		}
		
	});
    
}