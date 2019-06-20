import { Message, TextChannel } from "discord.js";
import { BehaviourInitializer } from "../Interfaces";
import { Utils } from "../misc/Utils";
import { Rules } from "../Rules";

export let init: BehaviourInitializer = (bot) => {

    const CACHE_SIZE: number = 100;
    const mockMsgCache: Map<string, Message> = new Map();

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