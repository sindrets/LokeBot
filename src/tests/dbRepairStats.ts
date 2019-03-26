import { BotEvent } from "Constants";
import { EventHandler } from "EventHandler";
import { Loker } from "Interfaces";
import { Logger } from "Logger";
import LokeBot from "LokeBot";
import { Collection } from "mongodb";

let bot = new LokeBot();
EventHandler.on([BotEvent.BOT_READY, BotEvent.CONNECTED], () => {

    let db = bot.dbRemote.getDb();
    let lokeStats: Collection | undefined;
    if (db) {
        lokeStats = db.collection("lokeStats");
    }

    bot.dbRemote.getStatsAll((docs, err) => {
        if (err) {
            Logger.error(err);
            return;
        }
        if (docs) {
            docs.forEach(doc => {

                let target: Loker | null = null;

                if (doc.uid == undefined) {
                    target = bot.queryUsers(doc.user || "", true);
                    if (target) {
                        doc.uid = target.user.id;
                    }
                }

                if (doc.user == undefined) {
                    target = bot.queryUsers(doc.uid || "", true);
                    if (target) {
                        doc.user = target.user.tag;
                    }
                }

                if (doc.state == undefined) {
                    doc.state = false;
                }

                if (doc.meanderDays == undefined) {
                    doc.meanderDays = [];
                }

                if (lokeStats) {
                    lokeStats.replaceOne({ _id: doc._id }, doc, (err, result) => {
                        if (err) Logger.error(err);
                        if (result) Logger.success("Successfully wrote document for user: " + doc.user);
                    })
                }
                
            })
        }
    })
    
}, true);
bot.start();