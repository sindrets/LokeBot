import { CommandHandler } from "CommandHandler";
import LokeBot from "LokeBot";
import { manual } from "Manual";

export function init(ch: CommandHandler, bot: LokeBot) {

    /**
     * @flag --here
     */
    ch.addCommand("help", (msg, flags, args) => {

        let s: string[] = [""];
        if (args[0]) {
            let cmd = (args[0] as string).toLowerCase();
            if (manual[cmd] != undefined) {
                s[0] = manual[cmd];
            } else {
                s[0] = "/**\n * There was no command by that name in the manual. \n */";
            }
        } else {
            s = [];
            for (let cmd in manual) {
                s.push(manual[cmd]);
            }
        }

        // if the "here" flag is provided: send help to current
        // channel.
        let sendHere = flags.isTrue("here");
        if (sendHere && msg.guild) {
            s.forEach((helpString, i, c) => {
                msg.channel.send("```java\n" + helpString + "\n```");
            });
            return;
        }
        else if (msg.guild) {
            msg.reply("Manual oppslag ble sendt som DM.");
        }

        s.forEach((helpString, i, c) => {
            msg.author.send("```java\n" + helpString + "\n```");
        })

    })

}