import { GelbooruResponseBody, CmdInitializer } from "Interfaces";
import { TrashConveyor } from "TrashConveyor";

export let init: CmdInitializer = (ch, bot) => {

    ch.addCommand("iamtrash", (msg, flags, ...args: string[]) => {

        let response: GelbooruResponseBody | null = null;
        TrashConveyor.getRandomPost(args).then(resp => {
            response = resp;

            if (response) {
                msg.reply(response.file_url);
            }
        })

    });
    
}