import config from "config.json";
import cronParser from "cron-parser";
import LokeBot from "LokeBot";
import { sprintf } from "sprintf-js";
import moment = require("moment-timezone");
import { getActiveException } from "commands/CmdException";
import { printNextInvocations } from "misc/ScheduleJobUtc";

export function init(bot: LokeBot) {

	bot.client.on("message", msg => {

		// if a user sends a message during the judgement period; unmark
		// them as Loker and add "Rutta-gutta" role.
		let loker = bot.getLokerById(msg.author.id);
		if (msg.guild && loker && loker.status) {

			let format: string = "HH:mm";
			let t = moment.tz(config.timezone);
			let dayOfWeek = t.weekday();
			let periodStart = cronParser.parseExpression(config.timeReset);
			let periodEnd = cronParser.parseExpression(config.timeJudgement);
			let active: boolean = t.isBetween(
				moment(periodStart.next()._date.format(format), format).tz(config.timezone, true),
				moment(periodEnd.next()._date.format(format), format).tz(config.timezone, true)
			) && (
				periodStart._fields.dayOfWeek.indexOf(dayOfWeek) != -1 &&
				periodEnd._fields.dayOfWeek.indexOf(dayOfWeek) != -1
			);

			bot.dbRemote.getExceptionAll((docs, err) => {

				if (docs) {
					// ignore exception periods.
					if (getActiveException(docs) !== null) {
						active = false;
					}
				}

				if (active && loker) {
					bot.dbRemote.getStatsSingle(loker.user, doc => {

						if ((doc && doc.state && loker) || (!doc && loker)) {
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

			}, true);
		}

	})

}