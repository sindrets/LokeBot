import LokeBot from "LokeBot";

export function init(bot: LokeBot) {

    bot.client.on("message", msg => {

        bot.commandHandler.parseCommand(msg);
        
    })
    
}