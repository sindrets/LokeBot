import LokeBot from "./LokeBot";
import moment from "moment";
import config from "./config.json";
import { User, Guild, GuildMember } from "discord.js";
import { GuildMap } from "./Interfaces";

export function initBehaviour(bot: LokeBot): void {

	// -- INIT SCHEDULES --
	// set all users' loke status to true, and remove Loker role every 
	// morning.
	bot.scheduleJobUtc("Reset Loke-Status", { hour: parseInt(config.periodStart), minute: 0, second: 0 }, config.utcTimezone, () => {
		
		console.log("Resetting Loke roles...");
		bot.iterateLokere(loker => {

			loker.status = true;

			bot.getMemberships(loker.user).forEach(member => {

				bot.getLokerRole(member.guild).then(role => {
					member.removeRole(role);
				})

			})
		});
	});

	// all users who are still marked as Loker at periodEnd, gets the 
	// Loker role.
	bot.scheduleJobUtc("Prosecute Lokere", { hour: parseInt(config.periodEnd), minute: 0, second: 0 }, config.utcTimezone, () => {
		
		// ignore saturdays and sundays.
		let now = moment().utc().weekday();
		if (now == 0 || now == 6) {
			bot.logNextInvocations();
			return;
		}

		console.log("Prosecuting lokere...");

		// map out all guilty users from each guild and add Loker role 
		// on all the users' guilds. Register day in database.
		let guiltyMap: Map<Guild, GuildMember[]> = new Map<Guild, GuildMember[]>();

		bot.iterateLokere(loker => {
			
			bot.getMemberships(loker.user).forEach(member => {
				let memberList = guiltyMap.get(member.guild);
				if (!memberList) {
					guiltyMap.set(member.guild, []);
					memberList = guiltyMap.get(member.guild);
				}
				if (loker.status && memberList) {
					memberList.push(member);

					// Add Loker role
					bot.getLokerRole(member.guild).then(role => {
						member.addRole(role);
					})
					// Register a new loke-day in the database
					bot.dbRemote.addLokeDay(member.user.tag);
				}

			})

		});

		// Iterate over all guilds, and announce lokere
		guiltyMap.forEach((memberList, guild, c) => {

			let channel = LokeBot.getBotChannel(guild);
			if (channel) {
				if (memberList.length > 0) {
					channel.send("⚠ DAGENS LOKERE ER DØMT! ⚠");
					let s = "";
					memberList.forEach(user => {
						s += `${user} `;
					});
					channel.send(s);
					console.log(memberList);
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