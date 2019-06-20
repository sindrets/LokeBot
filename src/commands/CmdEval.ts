import chalk from "chalk";
import stringifyObject from "stringify-object";
import { CmdInitializer } from "../Interfaces";
import { Logger } from "../Logger";

export let init: CmdInitializer = (ch, bot) => {

    /**
     * Debugging command. Evaluate and run javascript on the server.
     */
    ch.addCommand("eval", (msg, flags, ...args) => {

        if (msg.guild != null || !bot.isDevAdmin(msg.author.id)) return;

        if (args) {
            let stringify = stringifyObject; // for use in eval
            let arg = (args as string[]).join(" ");
            let result = "";
            try {
                result = eval(arg);
            } catch (e) {
                result = (e as Error).message + "\n\n" + (e as Error).stack;
            }
            Logger.print(chalk.magenta(`EVAL: invocated by ${msg.author.tag}: `));
            Logger.println(arg);
            msg.author.send("```\n" + result + "\n```");
        }

    });

}