import { Guild, GuildMember, RichEmbed, User } from "discord.js";
import moment from "moment-timezone";
import config from "../config.json";
import { CmdInitializer } from "../Interfaces";
import { Utils } from "../misc/Utils";

export let init: CmdInitializer = (ch, bot) => {

    /**
     * if additional arg is supplied: query stats for that user.
     * @param args[0] user query 
     * @flag --all
     */
    ch.addCommand("stats", (msg, flags, userQuery: string, ...args) => {

        let name = msg.member ? msg.member.displayName : msg.author.username;
        let target: User = msg.author;
        let guild: Guild | undefined = msg.guild;
        let now = moment.utc().tz(config.timezone || moment.tz.guess());

        // @param arg[0] user query.
        if (userQuery !== undefined) {
            let member = bot.queryUsers(userQuery, guild);
            if (member) {
                target = member.user;
                if (member instanceof GuildMember)
                    name = member.displayName;
                else name = target.username;
            }
        }

        let embed = new RichEmbed({
            title: "Registrerte loke-dager:",
            color: parseInt("9D05A6", 16),
            footer: {
                icon_url: "https://cdn.discordapp.com/avatars/546725392090791948/787e9d669a2144424171251ba42e2d9d.png?size=128",
                text: "Stats provided by LokeBot"
            },
            thumbnail: {
                url: target.avatarURL
            },
            author: {
                name: `${name}'s stats`,
                icon_url: target.avatarURL
            },
            fields: [
                {
                    name: "Denne uken:",
                    value: "0",
                    inline: true
                },
                {
                    name: "Denne måneden:",
                    value: "0",
                    inline: true
                },
                {
                    name: "Totalt:",
                    value: "0",
                    inline: true
                },
                {
                    name: "Siste 5 registrerte loke-dager:",
                    value: "```\nIngen registrerte loke-dager!```"
                }
            ]
        });

        bot.dbRemote.getStatsSingle(target, doc => {

            if (doc && embed.fields != undefined) {

                let lastMonth = Utils.getDatesInPeriod(doc.meanderDays, "month", now.month() + 1);
                let lastWeek = Utils.getDatesInPeriod(doc.meanderDays, "week", now.isoWeek());

                embed.fields[0].value = String(lastWeek.length);		// week count
                embed.fields[1].value = String(lastMonth.length);		// month count
                embed.fields[2].value = String(doc.meanderDays.length);	// total count

                if (flags.isTrue("all")) {

                    embed.fields[3].name = "Fullstendige loke-statistikk:";
                    let s = "\n```";
                    s += "\n["
                    doc.meanderDays.forEach((date, index, c) => {
                        let t = moment(date).utc().tz(config.timezone || moment.tz.guess());
                        s += "\n  " + t.toString();
                    })
                    s += "\n]";
                    s += "\n```";
                    embed.fields[3].value = s;

                }
                else {

                    let s = "\n```";
                    doc.meanderDays.some((date, index) => {
                        let t = moment(date).utc().tz(config.timezone || moment.tz.guess());
                        s += "\n" + t.toString();
                        return index >= 4;
                    })
                    s += "\n```";
                    s += "For fullstendig statistikk; benytt flagget `--all`.";
                    embed.fields[3].value = s;

                }

            }

            msg.reply("", { embed: embed });

        }, true)

    });

}