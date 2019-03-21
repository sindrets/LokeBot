import { CommandHandler } from "CommandHandler";
import { GelbooruResponseBody } from "Interfaces";
import LokeBot from "LokeBot";
import { TrashConveyor } from "TrashConveyor";

export function init(ch: CommandHandler, bot: LokeBot) {

    ch.addCommand("iamtrash", (msg, flags, args) => {

        let response: GelbooruResponseBody | null = null;
        TrashConveyor.getRandomPost(args).then(resp => {
            response = resp;

            if (response) {
                msg.reply(response.file_url);
            }
        })

    });
    
}