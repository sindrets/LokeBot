import { BotEvent } from "../Constants";
import { EventHandler } from "../EventHandler";
import LokeBot from "../LokeBot";
import { Logger } from "Logger";

const bot = new LokeBot();
EventHandler.on([BotEvent.BOT_READY, BotEvent.CONNECTED], () => {
	
	bot.dbRemote.getStatsAll((docs, err) => {
		if (err) Logger.println(err);
		if (docs) Logger.println(docs);
	}, true);
    
}, true);
bot.start();