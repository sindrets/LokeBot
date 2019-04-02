import { BotEvent } from "Constants";
import { EventHandler } from "EventHandler";
import LokeBot from "LokeBot";
import { Logger } from "Logger";

const bot = new LokeBot();
EventHandler.on([BotEvent.BOT_READY, BotEvent.CONNECTED], () => {
    
    const db = bot.dbRemote.getDb();
    if (db) {
        db.collections().then(collections => {

            Logger.println(collections);
            
        })
    }
    
}, true);
bot.start();