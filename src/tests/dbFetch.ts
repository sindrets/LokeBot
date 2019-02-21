
import LokeBot from "../LokeBot";
import { BotEvent } from "../Constants";
import { EventHandler } from "../EventHandler";

const bot = new LokeBot();
EventHandler.on(BotEvent.BOT_READY, () => {

	const db = bot.dbRemote.getDb();
	if (db) {
		const cltn = db.collection("lokeStats");
		// fetch all documents in collection
		cltn.find({}).toArray((err, doc) => {
			console.log(doc);
		});
	}
    
});
bot.start();