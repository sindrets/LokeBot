import LokeBot from "LokeBot";
import { BotEvent } from "Constants";
import { EventHandler } from "EventHandler";

const bot = new LokeBot();
EventHandler.on([BotEvent.BOT_READY, BotEvent.CONNECTED], () => {

    bot.dbRemote.setStateAll(true);
    
}, true);
bot.start();