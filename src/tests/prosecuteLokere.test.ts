import LokeBot from "../LokeBot";
import { init as initJob, StateProsecuteLokere } from "../behaviour/ProsecuteLokere";
import { EventHandler } from "../EventHandler";
import { BotEvent } from "../Constants";

const bot = new LokeBot({ useTestDb: true });

beforeAll(async () => {
	await bot.start();
})

afterAll(async () => {
	await bot.dbRemote.disconnect();
	await bot.client.destroy();
});

test("Normal prosecution is triggered", async () => {

	return new Promise<void>((resolve, reject) => {

		EventHandler.on([BotEvent.BOT_READY, BotEvent.CONNECTED], async () => {
			let job = initJob(bot);
			let state: StateProsecuteLokere = await job.job();
			expect(state.willProsecute).toBe(true);
			resolve();
		}, true);
		
	});
	
});
