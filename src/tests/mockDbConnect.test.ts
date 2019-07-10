import LokeBot from "../LokeBot";

const bot = new LokeBot({ useTestDb: true });

afterAll(async () => {
	await bot.dbRemote.disconnect();
	await bot.client.destroy();
})

jest.setTimeout(60_000);
test("Connect to test DB", () => {
	return bot.dbRemote.connect().then(() => {
		expect(bot.dbRemote.isConnected()).toBe(true);
	});
})

