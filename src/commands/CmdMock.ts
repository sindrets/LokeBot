import { CommandHandler } from "CommandHandler";
import LokeBot from "LokeBot";
import { Utils } from "Utils";


export function init(ch: CommandHandler, bot: LokeBot) {

    ch.addCommand("mock", (msg, flags, args) => {

        if (args.length == 0) {
            msg.reply("Please provide a string to mockify. For usage; `#!help mock`");
            return;
        }

        bot.userSay(msg.author, Utils.mockifyString(args.join(" ")), "", msg.channel);
        if (msg.deletable) {
            msg.delete();
        }
        
    })
    
}