import LokeBot from "./LokeBot";
import moment from "moment";
import config from "./config.json";
import { User } from "discord.js";

export function initBehaviour(bot: LokeBot): void {

	// -- INIT SCHEDULES --
	//		set all users' loke status to true, and remove Loker role every morning.
	bot.scheduleJobUtc("Reset Loke-Status", { hour: parseInt(config.periodStart), minute: 0, second: 0 }, config.utcTimezone, () => {
		
		console.log("Resetting Loke roles...");
		bot.mapLokere(loker => {
			loker.status = true;
			// TODO: ensure that the Loke role exists in the guild.
			let r = bot.getLokerRole(loker.member.guild);
			if (r) loker.member.removeRole(r);
		});
	});
	//		all users who are still marked as Loker at periodEnd, gets the Loker role.
	bot.scheduleJobUtc("Prosecute Lokere", { hour: parseInt(config.periodEnd), minute: 0, second: 0 }, config.utcTimezone, () => {
		
		// ignore saturdays and sundays.
		let now = moment().utc().weekday();
		if (now == 0 || now == 6) {
			bot.logNextInvocations();
			return;
		}
		
		console.log("Prosecuting lokere...");
		bot.mapLokere(loker => {
			if (loker.status) {
				let r = bot.getLokerRole(loker.member.guild);
				if (r) loker.member.addRole(r);
			}
		});

		bot.guildMap.forEach((memberMap, guild, guildCollection) => {
			let lokerList: User[] = [];
			memberMap.forEach((loker, memberId, memberCollection) => {
				if (loker.status) {
					let r = bot.getLokerRole(loker.member.guild);
					if (r) loker.member.addRole(r);
					lokerList.push(loker.member.user);
					bot.dbRemote.addLokeDay(loker.member.user.tag);
				}
			});

			let channel = LokeBot.getBotChannel(guild);
			if (channel) {
				if (lokerList.length > 0) {
					channel.send("⚠ DAGENS LOKERE ER DØMT! ⚠");
					let s = "";
					lokerList.forEach(user => {
						s += `${user} `;
					});
					channel.send(s);
				} else {
					channel.send("Ingen lokere i dag! 🤔");
				}
			}
		})
		bot.logNextInvocations();
	});

	bot.client.on("message", msg => {

		bot.commandHandler.parseCommand(msg);
		
		// if a user sends a message during the judgement period; unmark them as Loker.
		let format: string = "hh:mm";
		let t = moment().utc().utcOffset(config.utcTimezone * 60);
		let active: boolean = t.isBetween(moment(config.periodStart, format), moment(config.periodEnd, format));
		if (active) {
			let loker = bot.getLokerById(msg.author.id);
			if (loker) loker.status = false;
		}

		// you just activated my trap card...
		let result = msg.content.match(/[^a-zA-Z]?no u[^a-zA-Z]?/mi);
		if (result != null) {
			let imgs = [
				"https://i.imgur.com/oqn5SGO.png",
				"https://i.imgur.com/UzUz6yi.jpg",
				"https://i.imgur.com/tCCmdp6.png"
			]
			let i = ~~(Math.random() * imgs.length);
			msg.reply({ file: imgs[i] });
		}

	});

	bot.client.on("messageReactionAdd", (reaction, user) => {
		
		// mOckIfY meSsAGe
		if (reaction.emoji.toString() == "🐔" && reaction.message.content.length > 0) {
			let s = reaction.message.content.split("");
			let result = "";
			while (s.length > 0) {
				let f = ~~(Math.random() * 2);
				if (f == 0)
					result += (s.shift() as string).toLowerCase();
				else result += (s.shift() as string).toUpperCase();
			}
			reaction.message.reply(result);
		}
		
	});
	
}