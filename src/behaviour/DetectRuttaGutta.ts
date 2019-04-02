import config from "config.json";
import LokeBot from "LokeBot";
import { sprintf } from "sprintf-js";
import moment = require("moment-timezone");

export function init(bot: LokeBot) {

    bot.client.on("message", msg => {

        // if a user sends a message during the judgement period; unmark
		// them as Loker and add "Rutta-gutta" role.
		let loker = bot.getLokerById(msg.author.id);
		if (msg.guild && loker && loker.status) {

			let format: string = "hh:mm";
			let t = moment.utc().tz(config.timezone || moment.tz.guess());
			let active: boolean = t.isBetween(moment(config.periodStart, format), moment(config.periodEnd, format));

			// ensure that it's not a weekend.
			if (active && [6,7].indexOf(t.isoWeekday()) == -1) {
				bot.dbRemote.getStatsSingle(loker.user, doc => {
					
					if ( (doc && doc.state && loker) || (!doc && loker) ) {
						loker.status = false;
						bot.dbRemote.setStateSingle(loker.user, false);

						let sList: string[] = [
							"Sjekk hvem som er rutta! Det er %s!",
							"Hvem loker? Hvertfall ikke %s!",
							"Hva faaaen a? Sjekk %s er rutta!"
						];
						let i = ~~(Math.random() * sList.length);
						msg.channel.send(sprintf(sList[i], msg.author));

						// add Rutta-gutta role
						loker.guilds.forEach(guild => {
							bot.getRuttaRole(guild).then(role => {
								if (loker) {
									let member = bot.queryUsers(loker.user.id, guild, true);
									if (member) member.addRole(role);
								}
							})
						})
					}
					else if (doc && loker) {
						loker.status = doc.state;
					}
					
				});

			}
		}
        
    })
    
}