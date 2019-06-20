import { CmdInitializer } from "../Interfaces";
import owofy from "owofy";

export let init: CmdInitializer = (ch, bot) => {

    ch.addCommand("owo", (msg, flags, ...args) => {

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