import { Guild, GuildMember } from 'discord.js';
import { Job } from "node-schedule";
import { getActiveException } from "../commands/CmdException";
import config from "../config.json";
import { BehaviourInitializer } from "../Interfaces";
import { Logger } from "../Logger";
import LokeBot from "../LokeBot";
import { printNextInvocations, scheduleJobUtc } from "../misc/ScheduleJobUtc";

export interface StateProsecuteLokere {
	isException?: boolean,
	willProsecute?: boolean,
	lokere?: GuildMember[],
	noLokere?: boolean
}

export let init: BehaviourInitializer = (bot): Job | null => {

	// all users who are still marked as Loker at periodEnd, gets the 
	// Loker role.
	return scheduleJobUtc("Prosecute Lokere", config.timeJudgement, config.timezone, async (): Promise<StateProsecuteLokere> => {

		return new Promise((resolve, reject) => {

			let state: StateProsecuteLokere = {};

			bot.dbRemote.getExceptionAll((docs, err) => {

				if (docs) {
					// ignore exception periods.
					let exceptionPeriod = getActiveException(docs);
					if (exceptionPeriod !== null) {
						Logger.info(`Exception '${exceptionPeriod.name}' in effect; skipping prosecution!`);
						printNextInvocations();
						state.isException = true;
						resolve(state);
						return;
					}
				}

				Logger.info("Prosecuting lokere...");
				state.willProsecute = true;

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
								state.lokere = [];
								channel.send("⚠ DAGENS LOKERE ER DØMT! ⚠");
								let s = "";
								memberList.forEach(member => {
									s += `${member} `;
									if (state.lokere) state.lokere.push(member);
								});
								channel.send(s);
								bot.ppUserList(memberList, true);
							} else {
								channel.send("Ingen lokere i dag! 🤔");
								state.noLokere = true;
							}
						}
					})

					printNextInvocations();
					resolve(state);

				})
			}, true);

		});

	});

}