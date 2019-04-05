import config from "config.json";
import { Guild, GuildMember } from 'discord.js';
import LokeBot from "LokeBot";
import moment from 'moment';
import { Logger } from "Logger";
import { scheduleJobUtc, printNextInvocations } from "misc/ScheduleJobUtc";

export function init(bot: LokeBot) {

    // all users who are still marked as Loker at periodEnd, gets the 
	// Loker role.
	scheduleJobUtc("Prosecute Lokere", config.timeJudgement, config.timezone, () => {
		
		// ignore saturdays and sundays.
		let now = moment().utc().isoWeekday();
		if (now == 6 || now == 7) {
			printNextInvocations();
			return;
		}

		Logger.info("Prosecuting lokere...");

		bot.dbRemote.getStatsAll(docs => {

			// map out all guilty users from each guild and add Loker role 
			// on all the users' guilds. Register day in database.
			let guiltyMap: Map<Guild, GuildMember[]> = new Map();
			let dbStates = docs || [];

			bot.iterateLokere(loker => {

				let dbState = loker.status;
				dbStates.slice(0).some((doc, i) => {
					if (doc.uid == loker.user.id) {
						dbState = doc.state;
						dbStates.splice(i, 1);
						return true;
					}
					return false;
				})
			
				bot.getMemberships(loker.user).forEach(member => {
					let memberList = guiltyMap.get(member.guild);
					if (!memberList) {
						memberList = [];
						guiltyMap.set(member.guild, memberList);
					}
					if (dbState) {
						memberList.push(member);
	
						// Add Loker role
						bot.getLokerRole(member.guild).then(role => {
							member.addRole(role);
						})
						// Register a new loke-day in the database
						bot.dbRemote.addDaySingle(member.user);
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
						bot.ppUserList(memberList, true);
					} else {
						channel.send("Ingen lokere i dag! 🤔");
					}
				}
			})
	
			printNextInvocations();
			
		})

	});
    
}