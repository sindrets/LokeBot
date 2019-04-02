import { EventHandler } from "EventHandler";
import { BotEvent } from "Constants";
import LokeBot from "LokeBot";
import { Scoreboard, ScoreboardItem, RankStrategy } from "Scoreboard";
import moment from "moment-timezone";
import config from "config.json";
import { Logger } from "Logger";
import AsciiTable from "ascii-table";

const bot = new LokeBot();
EventHandler.on([BotEvent.BOT_READY, BotEvent.CONNECTED], () => {
	
    let scoreboard = new Scoreboard();
    let now = moment.utc().tz(config.timezone);
    bot.dbRemote.getStatsPeriodAll("month", now.month(), (docs, err) => {
        if (err) return;
        if (docs) {

            docs.forEach(doc => {
                scoreboard.addItem(new ScoreboardItem(doc.uid, doc.user, {
                    "meanderDays": { value: doc.meanderDays.length }
                }))
            })

            let ranked = scoreboard.rank("meanderDays", RankStrategy.ASCENDING);
            Logger.println(ranked);

            let table = new AsciiTable();
            table.setBorder(" ", "-", " ", " ")
                 .setAlign(1, AsciiTable.CENTER)
                 .setAlign(2, AsciiTable.CENTER)
                 .setHeading("#", "User", "Loke-dager")

            ranked.forEach(item => {
                table.addRow(item.rank, item.name, item.fields["meanderDays"].value);
            })

            Logger.println(table.toString());
            
        }
    })
    
}, true);
bot.start();