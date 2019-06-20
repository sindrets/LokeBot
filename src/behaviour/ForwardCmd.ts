import { BehaviourInitializer } from "../Interfaces";

export let init: BehaviourInitializer = (bot) => {

    bot.client.on("message", msg => {

        bot.commandHandler.parseCommand(msg);
        
    })
    
}