import LokeBot from "../LokeBot";
import { TextChannel } from "discord.js";
import moment = require("moment");
import { BotEvent } from "../Constants";

const bot = new LokeBot();
bot.on(BotEvent.READY, () => {

    let lokeChat: TextChannel | undefined;

    // console.log("\n\n\n---MEMBERS---");
    // console.log(bot.client.guilds.array()[0].members);
    // console.log("\n\n\n---CHANNELS---");
    // bot.client.guilds.array()[0].channels.forEach((c) => {
    // 	console.log(c);
    // });
    // console.log("\n\n\n");
    // console.log(LokeBot.getBotChannel(bot.client.guilds.array()[0]));

    // lokeChat = LokeBot.getBotChannel(bot.client.guilds.array()[0]);
    // bot.scheduleUtcOffset({ hour: 17, second: 0 }, -1, () => {
    // 	console.log("Current time UTC offset -1: " + moment().utcOffset(0).toString());
    // });

    bot.prettyPrintMemberDict();

    bot.client.on('message', msg => {
        if (msg.content === 'ping') {
            msg.reply('pong');
        }
    });
    
});
bot.start();