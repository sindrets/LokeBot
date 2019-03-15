import LokeBot from "../LokeBot";
import { BotEvent } from "../Constants";
import { EventHandler } from "src/EventHandler";

const bot = new LokeBot();
EventHandler.on(BotEvent.BOT_READY, () => {

    bot.ppGuildMap();

    bot.client.on('message', msg => {
        if (msg.content === 'ping') {
            msg.reply('pong');
        }
    });

    bot.commandHandler.addCommand("test", (msg, flags, args) => {
        msg.reply(`Command Parser: Command recognised, parsed and executed with args: ${args}`);
    });
    
}, true);
bot.start();