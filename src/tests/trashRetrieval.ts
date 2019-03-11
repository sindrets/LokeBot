import LokeBot from "../LokeBot";
import { BotEvent } from "../Constants";
import { EventHandler } from "../EventHandler";
import { TrashConveyor } from "../TrashConveyor";

const bot = new LokeBot();
EventHandler.on(BotEvent.BOT_READY, () => {

    TrashConveyor.getRandomPost(["brown_hair", "hat"]).then(resp => {
        console.log(resp);
    });
    
});
bot.start();