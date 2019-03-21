import LokeBot from "LokeBot";
import { CommandHandler } from "CommandHandler";
import { Leet } from "misc/Leet";

export function init(ch: CommandHandler, bot: LokeBot) {

    /**
     * @flag --decode
     */
    ch.addCommand("l33t", (msg, flags, args) => {

        if (args.length == 0) {
            msg.reply("Please provide a string to convert. For usage; `#!help l33t`");
            return;
        }

        let content = args.join(" ");

        if (flags.isTrue("decode")) {
            msg.reply("Decoding l33t 5tr1n6: \n```\n" + content + "\n" + Leet.decode(content) + "\n```");
            return;
        }

        bot.userSay(msg.author, Leet.encode(content), "", msg.channel);
        if (msg.deletable) {
            msg.delete();
        }
        
    })
    
}