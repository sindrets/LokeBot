
import LokeBot from "../LokeBot";
import { BotEvent } from "../Constants";
import { EventHandler } from "../EventHandler";

const bot = new LokeBot();
EventHandler.on([BotEvent.BOT_READY, BotEvent.CONNECTED], () => {
	
	bot.dbRemote.getStatsAll((docs, err) => {
		if (err) console.log(err);
		if (docs) console.log(docs);
	}, true);
    
}, true);
bot.start();