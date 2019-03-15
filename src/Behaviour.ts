import { Guild, GuildMember, Message, TextChannel } from "discord.js";
import moment from "moment";
import { sprintf } from "sprintf-js";
import config from "./config.json";
import LokeBot from "./LokeBot";
import { Rules } from "./Rules";
import { Utils } from "./Utils";

const CACHE_SIZE: number = 100;
var mockMsgCache: Map<string, Message> = new Map();

export function initBehaviour(bot: LokeBot): void {

	// -- INIT SCHEDULES --
	// set all users' loke status to true, and remove "Loker" /
	// "Rutta-gutta" role every morning.
	bot.scheduleJobUtc("Reset Loke-Status", { hour: parseInt(config.periodStart), minute: 0, second: 0 }, config.utcTimezone, () => {
		
		console.log("Resetting Loke roles...");
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

	// all users who are still marked as Loker at periodEnd, gets the 
	// Loker role.
	bot.scheduleJobUtc("Prosecute Lokere", { hour: parseInt(config.periodEnd), minute: 0, second: 0 }, config.utcTimezone, () => {
		
		// ignore saturdays and sundays.
		let now = moment().utc().isoWeekday();
		if (now == 6 || now == 7) {
			bot.logNextInvocations();
			return;
		}

		console.log("Prosecuting lokere...");

		bot.dbRemote.getStateAll(docs => {

			// map out all guilty users from each guild and add Loker role 
			// on all the users' guilds. Register day in database.
			let guiltyMap: Map<Guild, GuildMember[]> = new Map();
			let dbStates = docs || [];

			bot.iterateLokere(loker => {

				let dbState = loker.status;
				dbStates.slice(0).some((doc, i) => {
					if (doc.user == loker.user.tag) {
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
						bot.dbRemote.addDaySingle(member.user.tag);
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
	
			bot.logNextInvocations();
			
		})

	});

	// weekend announcement
	bot.scheduleJobUtc("Weekend Announcement", { hour: 16, minute: 0, second: 0 }, config.utcTimezone, () => {
		
		let now = moment.utc().isoWeekday();
		if (now == 5) {

			bot.guildMap.forEach((users, guild) => {
				let channel = LokeBot.getBotChannel(guild);
				if (channel) {
					channel.send("🍻 @everyone 🍻", { file: "https://i.imgur.com/sde4YwH.png" });
				}
			})
			
		}
		
	});

	bot.client.on("message", msg => {

		bot.commandHandler.parseCommand(msg);
		
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

						// add Rutta-gutta role
						loker.guilds.forEach(guild => {
							bot.getRuttaRole(guild).then(role => {
								if (loker) {
									let member = bot.queryUsers(loker.user.tag, guild, true);
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

			let cached = mockMsgCache.get(reaction.message.id);

			if (cached === undefined) {

				// §2 violation: tried to mock LokeBot
				if (reaction.message.author.id == bot.client.user.id) {
					let channel = undefined;
					if (reaction.message.guild) {
						channel = reaction.message.channel as TextChannel;
					}
					bot.ruleEnforcer.prosecuteViolator(user, Rules["§2"], channel);
					return;
				}

				bot.userSay(
					user, 
					Utils.mockifyString(reaction.message.content), 
					reaction.message.author.toString(), 
					reaction.message.channel
				);
				
			} else {
				// §1 violation: tried to mock mockified message
				let channel = undefined;
				if (reaction.message.guild) {
					channel = reaction.message.channel as TextChannel;
				}
				bot.ruleEnforcer.prosecuteViolator(user, Rules["§1"], channel);
				return;
			}

			mockMsgCache.set(reaction.message.id, reaction.message);
			// If cache is full: delete oldest entry
			if (mockMsgCache.size > CACHE_SIZE) {
				mockMsgCache.delete(mockMsgCache.keys().next().value);
			}
		}
		
	});
	
}