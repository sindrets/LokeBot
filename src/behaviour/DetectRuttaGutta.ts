import config from "config.json";
import LokeBot from "LokeBot";
import { sprintf } from "sprintf-js";
import moment = require("moment");

export function init(bot: LokeBot) {

    bot.client.on("message", msg => {

        // if a user sends a message during the judgement period; unmark
		// them as Loker and add "Rutta-gutta" role.
		let loker = bot.getLokerById(msg.author.id);
		if (msg.guild && loker && loker.status) {
			let format: string = "hh:mm";
			let t = moment.utc().add(config.utcTimezone, "hours");
			let active: boolean = t.isBetween(moment(config.periodStart, format), moment(config.periodEnd, format));
			if (active) {
				bot.dbRemote.getStateSingle(loker.user.tag, doc => {
					
					if ( (doc && doc.state && loker) || (!doc && loker) ) {
						loker.status = false;
						bot.dbRemote.setStateSingle(loker.user.tag, false);

						let sList: string[] = [
							"Sjekk hvem som er rutta! Det er %s!",
							"Hvem loker? Hvertfall ikke %s!",
							"Hva faaaen a? Sjekk %s er rutta!"
						];
						let i = ~~(Math.random() * sList.length);
						msg.channel.send(sprintf(sList[i], msg.author));

						// add Rutta-gutta role if it's not a weekend
						if (t.isoWeekday() != 6 && t.isoWeekday() != 7) {
							loker.guilds.forEach(guild => {
								bot.getRuttaRole(guild).then(role => {
									if (loker) {
										let member = bot.queryUsers(loker.user.tag, guild, true);
										if (member) member.addRole(role);
									}
								})
							})
						}
					}
					else if (doc && loker) {
						loker.status = doc.state;
					}
					
				});

			}
		}
        
    })
    
}