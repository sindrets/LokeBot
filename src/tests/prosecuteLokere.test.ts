import { init as initJob, StateProsecuteLokere } from "../behaviour/ProsecuteLokere";
import { BotEvent } from "../Constants";
import { EventHandler } from "../EventHandler";
import LokeBot from "../LokeBot";
import MockDate from "mockdate";

const bot = new LokeBot({ useTestDb: true, useDebugUser: true });

beforeAll(async () => {
	await bot.start();
})

afterAll(async () => {
	await bot.dbRemote.disconnect();
	await bot.client.destroy();
});

test("Normal prosecution is triggered", async () => {

	return new Promise<void>((resolve, reject) => {

		EventHandler.once([BotEvent.BOT_READY, BotEvent.CONNECTED], async () => {
			let job = initJob(bot);
			let state: StateProsecuteLokere = await job.job();
			expect(state.willProsecute).toBe(true);
			expect(state.isException).toBe(undefined);
			resolve();
		});
		
	});
	
});

test("Exceptions are treated correctly.", async () => {

	return new Promise((resolve, reject) => {

		EventHandler.once([BotEvent.BOT_READY, BotEvent.CONNECTED], async () => {
			let periodStart = new Date("2019-01-01T01:00:00");
			let periodEnd = new Date("2019-01-03T01:00:00");
			bot.dbRemote.insertExceptionSingle("test-exception", periodStart, periodEnd, async (err, result) => {
				let job = initJob(bot);
				let state: StateProsecuteLokere;
				
				// one second before start
				MockDate.set("2019-01-01T00:59:59");
				state = await job.job();
				expect(state.isException).toBe(undefined);
	
				// one second past start
				MockDate.set("2019-01-01T01:00:01");
				state = await job.job();
				expect(state.isException).toBe(true);
				
				// one second before end
				MockDate.set("2019-01-03T00:59:59");
				state = await job.job();
				expect(state.isException).toBe(true);

				// one second past end
				MockDate.set("2019-01-03T01:00:01");
				state = await job.job();
				expect(state.isException).toBe(undefined);

				MockDate.reset();

				resolve();
			});
		});
		
	});
	
});

// test("", async () => {

// 	return new Promise((resolve, reject) => {

// 		EventHandler.once([BotEvent.BOT_READY, BotEvent.CONNECTED], async () => {
			
// 		});
		
// 	});
	
// });
