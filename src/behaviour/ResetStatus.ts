import config from "../config.json";
import { BehaviourInitializer } from "../Interfaces";
import { Logger } from "../Logger";
import { scheduleJobUtc } from "../misc/ScheduleJobUtc";

export let init: BehaviourInitializer = (bot) => {

    // set all users' loke status to true, and remove "Loker" /
	// "Rutta-gutta" role every morning.
	scheduleJobUtc("Reset Loke-Status", config.timeReset, config.timezone, () => {
		
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