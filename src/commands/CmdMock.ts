import { CmdInitializer } from "../Interfaces";
import { Utils } from "../misc/Utils";

export let init: CmdInitializer = (ch, bot) => {

    ch.addCommand("mock", (msg, flags, ...args) => {

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