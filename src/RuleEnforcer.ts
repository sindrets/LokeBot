import { TextChannel, User } from "discord.js";
import { Rules } from "./Rules";
import { Utils } from "./Utils";
import { TrashConveyor } from "./TrashConveyor";

export class RuleEnforcer {

    public prosecuteViolator(user: User, brokenRule: Rules, channel?: TextChannel): void {

        let ruleKey = Utils.getObjKey(Rules, brokenRule);
        user.send(`Du har brutt Loke Reglementet ${ruleKey}: ${brokenRule}`
            + `\n\nStraffen for dette lovbruddet er:`);

        switch(brokenRule) {

            case Rules["§1"]: 
            case Rules["§2"]:

                user.send("Tre (3) innlegg fra Gelbooru med tag: tentacles.");
                for (let i = 0; i < 3; i++) {
                    TrashConveyor.getRandomPost(["tentacles"]).then(response => {
                        if (response) {
                            user.send(response.file_url);
                        }
                    });
                }

                break;

        }

        if (channel) {
            channel.send(`${user} stop right there criminal scum! You have violated the law! `
                +`Pay the court a fine, or pay with your blood!\nEn hensiktsmessig straff har blitt anvendt. `
                +`Ytteligere informasjon har blitt sendt som DM.`
            );
        }
        
    }
    
}