import LokeBot from "../LokeBot";
import { EventHandler } from "../EventHandler";
import { BotEvent } from "../Constants";

let bot = new LokeBot();
EventHandler.on([BotEvent.BOT_READY, BotEvent.CONNECTED], () => {

    let greg = bot.queryUsers("greg");
    if (greg) {
        bot.dbRemote.setStateSingle(greg.user.tag, false, (err, result) => {
            console.log(err);
            console.log(result);
        })
    }
    
}, true);
bot.start();