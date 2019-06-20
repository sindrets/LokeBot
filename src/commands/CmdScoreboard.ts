import AsciiTable from "ascii-table";
import { RichEmbed } from "discord.js";
import { CmdInitializer } from "../Interfaces";
import { Utils } from "../misc/Utils";
import { RankStrategy, Scoreboard, ScoreboardItem } from "../Scoreboard";

export let init: CmdInitializer = (ch, bot) => {

    ch.addCommand("scoreboard", (msg, flags, args) => {

        bot.dbRemote.getStatsAll((docs, err) => {

            if (err) return;
            if (docs) {

                let scoreboard = new Scoreboard();

                docs.forEach(lokerStats => {
                    let displayName = (bot.getDisplayName(lokerStats.uid, msg.guild) || "").trim();
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
                    let name = item.name;
                    if (name.length > 12) name = name.substr(0, 9) + "...";
                    table.addRow(item.rank, name, value, (100*value/30).toFixed(1) + "%");
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