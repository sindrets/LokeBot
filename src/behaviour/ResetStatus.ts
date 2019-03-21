import LokeBot from "LokeBot";
import config from "config.json";
import { Logger } from "Logger";

export function init(bot: LokeBot) {

    // set all users' loke status to true, and remove "Loker" /
	// "Rutta-gutta" role every morning.
	bot.scheduleJobUtc("Reset Loke-Status", { hour: parseInt(config.periodStart), minute: 0, second: 0 }, config.utcTimezone, () => {
		
		Logger.info("Resetting Loke roles...");
		bot.iterateLokere(loker => {

			loker.status = true;

			bot.getMemberships(loker.user).forEach(member => {

				bot.getLokerRole(member.guild).then(role => {
					member.removeRole(role);
				})
				bot.getRuttaRole(member.guild).then(role => {
					member.removeRole(role);
				})

			})

			bot.dbRemote.setStateAll(true);
		});
	});
    
}