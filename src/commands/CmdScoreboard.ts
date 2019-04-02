import { CommandHandler } from "CommandHandler";
import LokeBot from "LokeBot";
import AsciiTable from "ascii-table";
import { Scoreboard, ScoreboardItem, RankStrategy } from "Scoreboard";
import { Utils } from "misc/Utils";
import { RichEmbed } from "discord.js";

export function init(ch: CommandHandler, bot: LokeBot) {

    ch.addCommand("scoreboard", (msg, flags, args) => {

        bot.dbRemote.getStatsAll((docs, err) => {

            if (err) return;
            if (docs) {

                let scoreboard = new Scoreboard();

                docs.forEach(lokerStats => {
                    let displayName = bot.getDisplayName(lokerStats.uid, msg.guild) || "";
                    let interval = Utils.getDatesInLast(30, "days", lokerStats.meanderDays);
                    scoreboard.addItem(new ScoreboardItem(lokerStats.uid, displayName, { meanderDays: { value: interval.length } }));
                })

                let ranked = scoreboard.rank("meanderDays", RankStrategy.ASCENDING);
                let table = new AsciiTable();
                table.setBorder(" ", "-", " ", " ")
                     .setAlign(1, AsciiTable.CENTER)
                     .setAlign(2, AsciiTable.CENTER)
                     .setHeading("#", "User", "Loke-dager", "%");

                ranked.forEach(item => {
                    let value = item.fields["meanderDays"].value;
                    table.addRow(item.rank, item.name, value, (100*value/30).toFixed(1) + "%");
                });

                let embed = new RichEmbed();
                embed.author = { name: "Scoreboard" };
                embed.title = "(siste 30 dager)";
                embed.footer = {
                    text: "Stats provided by LokeBot",
                    icon_url: "https://cdn.discordapp.com/avatars/546725392090791948/787e9d669a2144424171251ba42e2d9d.png?size=128"
                }
                embed.description = "```\n" + table + "\n```";
                embed.color = parseInt("66c0f1", 16);

                msg.reply("", { embed: embed });

            }
            
        }, true)
        
    })
    
}