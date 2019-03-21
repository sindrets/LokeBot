import { CommandHandler } from "CommandHandler";
import LokeBot from "LokeBot";
import { Utils } from "misc/Utils";
import { Rules } from "Rules";

export function init(ch: CommandHandler, bot: LokeBot) {

    ch.addCommand("rules", (msg, flags, args) => {

        let s = " ⚖ 𝗟𝗢𝗞𝗘-𝗟𝗢𝗩 ⚖ "
            + "\nI henhold til Loke-Lov så er alle brudd på loke-paragrafene "
            + "straffbare. Ulike brudd kan ha ulike konsekvenser avhengig av bruddets "
            + "alvorlighetsgrad."
        Utils.objForEach(Rules, (rule, article) => {
            s += `\n\n${article}: ${rule}`;
        });

        msg.reply(s);

    });
    
}