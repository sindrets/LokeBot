import LokeBot from "../LokeBot";
import { EventHandler } from "../EventHandler";
import { BotEvent } from "../Constants";
import { Logger } from "Logger";

let bot = new LokeBot();
EventHandler.on([BotEvent.BOT_READY, BotEvent.CONNECTED], () => {

    let greg = bot.queryUsers("greg");
    if (greg) {
        bot.dbRemote.setStateSingle(greg.user, false, (err, result) => {
            Logger.println(err);
            Logger.println(result);
        })
    }
    
}, true);
bot.start();