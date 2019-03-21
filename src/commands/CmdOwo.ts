import { CommandHandler } from "CommandHandler";
import LokeBot from "LokeBot";
import owofy = require("owofy");

export function init(ch: CommandHandler, bot: LokeBot) {

    ch.addCommand("owo", (msg, flags, args) => {

        if (args.length == 0) {
            msg.reply("Please provide a string to owofy. For usage; `#!help owo`");
            return;
        }
        
        bot.userSay(msg.author, owofy(args.join(" ")), "", msg.channel);
        if (msg.deletable) {
            msg.delete();
        }

    });
    
}