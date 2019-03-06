
import LokeBot from "../LokeBot";
import { BotEvent } from "../Constants";
import { EventHandler } from "../EventHandler";

const bot = new LokeBot();
EventHandler.on(BotEvent.BOT_READY, () => {

	const db = bot.dbRemote.getDb();
	if (db) {
		const cltn = db.collection("lokeStats");
		// fetch all documents in collection
		cltn.find().toArray((err, doc) => {
			if (doc) {
				doc.forEach(obj => {
					// sort dates descending
					(obj.meanderDays as Date[]).sort((a,b) => {
						if (a < b) return 1;
						if (a > b) return -1;
						return 0;
					})
				})
				console.log(doc);
			}
		});
	}
    
});
bot.start();