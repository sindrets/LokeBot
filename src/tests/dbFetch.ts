import { BotEvent } from "Constants";
import { EventHandler } from "EventHandler";
import { Logger } from "Logger";
import LokeBot from "LokeBot";

const bot = new LokeBot();
EventHandler.on([BotEvent.BOT_READY, BotEvent.CONNECTED], () => {
	
	bot.dbRemote.getStatsAll((docs, err) => {
		if (err) Logger.println(err);
		if (docs) Logger.println(docs);
	}, true);
    
}, true);
bot.start();