import { BotEvent } from "../Constants";
import { EventHandler } from "../EventHandler";
import LokeBot from "../LokeBot";
import { TrashConveyor } from "../TrashConveyor";
import { Logger } from "Logger";

const bot = new LokeBot();
EventHandler.on(BotEvent.BOT_READY, () => {

    TrashConveyor.getRandomPost(["brown_hair", "hat"]).then(resp => {
        Logger.println(resp);
    });
    
}, true);
bot.start();