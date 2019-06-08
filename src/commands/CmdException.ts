import config from "config.json";
import { Message } from "discord.js";
import { CmdInitializer, ExceptionDoc } from "Interfaces";
import { Logger } from "Logger";
import { UserError } from "misc/UserError";
import { Utils } from "misc/Utils";
import moment from "moment-timezone";

export let init: CmdInitializer = (ch, bot) => {

	enum Operations {
		ADD = "add",
		REMOVE = "remove",
		LIST = "list"
	}

	class InsufficientPrivilegeError extends UserError {
		constructor(msg: Message) {
			super(
				"InsufficientPrivilegeError",
				"You lack the sufficient priviledge to execute this command.",
				msg
			);
		}
	}

	class InvalidPeriodError extends UserError {
		constructor(msg: Message) {
			super(
				"InvalidPeriodError",
				"Please specify a period in the format 'DD.MM.YYYY-DD.MM.YYYY'.",
				msg
			);
		}
	}

	class InvalidPeriodIdError extends UserError {
		constructor(msg: Message) {
			super(
				"InvalidPeriodIdError",
				"Please specify a valid period ID.",
				msg
			);
		}
	}

	ch.addCommand("exception", (msg, flags, operation?: string, ...args: string[]) => {

		switch (operation) {

			case Operations.ADD:

				if (!bot.isDevAdmin(msg.author)) {
					new InsufficientPrivilegeError(msg);
					return;
				}

				if (args[0] === undefined) {
					new UserError("InvalidNameError", "No name was specified!", msg);
					return;
				}
				let name = args[0];

				if (args[1] === undefined) {
					new InvalidPeriodError(msg);
					return;
				}

				let dates = args[1].split("-");
				if (dates.length != 2) {
					new InvalidPeriodError(msg);
					return;
				}

				let period: Date[] = [];
				let valid = true;
				dates.forEach(date => {
					let t = moment(date, "D.M.YYYY").tz(config.timezone, true);
					if (!t.isValid()) valid = false;
					period.push(t.toDate());
				});
				if (!valid) {
					new InvalidPeriodError(msg);
					return;
				}

				period.sort((a, b) => {
					if (a < b) return -1;
					if (a > b) return 1;
					return 0;
				});
				period[1].setHours(23, 59, 59);

				bot.dbRemote.insertExceptionSingle(name, period[0], period[1], (err, result) => {
					if (result) {
						msg.reply(
							"```\n"
							+ "Exception period successfully added:\n"
							+ "{\n"
							+ "  name: '" + name + "'\n"
							+ "  periodStart: " + moment(period[0]).toString() + "\n"
							+ "  periodEnd: " + moment(period[1]).toString() + "\n"
							+ "}\n"
							+ "```"
						);
					}
				});

				break;

			case Operations.REMOVE:

				if (!bot.isDevAdmin(msg.author)) {
					new InsufficientPrivilegeError(msg);
					return;
				}

				if (args[0] === undefined || isNaN(Number(args[0]))) {
					new InvalidPeriodIdError(msg);
					return;
				}

				bot.dbRemote.getExceptionAll((docs, err) => {

					if (docs) {
						let target = getRelevantExceptions(docs)[Number(args[0])];
						
						if (target === undefined) {
							new InvalidPeriodIdError(msg);
							return;
						}
						else if (target._id) {
							bot.dbRemote.deleteExceptionSingle(target._id, (err, result) => {
								if (err) {
									Logger.error(err);
								}

								if (result) {
									msg.reply("`Exception Successfully removed!`");
								}
							})
						}
					}
					
				}, true);

				break;

			case Operations.LIST:

				bot.dbRemote.getExceptionAll((docs, err) => {

					if (docs) {
						let result = "```\nUpcoming/active exception periods:\n";
						let n = 0;
						getRelevantExceptions(docs).forEach((doc, i) => {
							if (i > 0) result += "\n";
							let t0 = moment(doc.periodStart).format("DD.MM.YYYY");
							let t1 = moment(doc.periodEnd).format("DD.MM.YYYY");
							result += `${i}: '${doc.name}' ${t0}-${t1}`;
							n++;
						});
						if (n == 0) result += "--NO UPCOMING EXCEPTION PERIODS--";
						result += "\n```"

						msg.reply(result);
					}
					
				}, true);

				break;
			
			default:
				msg.reply("`Operation not specified or not recognized! Available operations: " + Utils.enumToString(Operations) + "`");
				return;

		}
		
	})
	
}

export function getRelevantExceptions (docs: ExceptionDoc[]) {

	let relevantPeriods: ExceptionDoc[] = [];
	let now = moment().tz(config.timezone).toDate();
	docs.slice(0).reverse().some((doc: ExceptionDoc) => {
		if (doc.periodEnd > now) {
			relevantPeriods.push(doc);
		}
		else return true;
		
		return false;
	});

	return relevantPeriods.reverse();
	
}

export function getActiveException(docs: ExceptionDoc[]): ExceptionDoc | null {

	let result: ExceptionDoc | null = null;
	let now = moment().tz(config.timezone).toDate();

	getRelevantExceptions(docs).some(doc => {

		if (doc.periodStart < now) {
			result = doc;
			return true;
		}

		return false;
	})

	return result;
	
}
