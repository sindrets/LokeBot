import fs from "fs";
import path from "path";
import readline from "readline";

if (!fs.existsSync(path.join(__dirname, "auth.json"))) {
	fs.copyFileSync(
		path.join(__dirname, "auth-TEMPLATE.json"),
		path.join(__dirname, "auth.json")
	);
}

import auth from "./auth.json";
import { FlagParser } from "./FlagParser";
import { Globals } from "./Globals";
import { Logger } from "./Logger";
import LokeBot, { LokeBotOpts } from "./LokeBot";

// global variables
var bot: LokeBot;
var BotGlobals = Globals;

Globals.args = process.argv.slice(2);
Globals.flags = FlagParser.parse(Globals.args, false);

if (Globals.flags.isTrue("debug")) {
	Globals.DEBUG_MODE = true;
	Logger.debugln("Running in debug mode!");
	Logger.debugln("pid: ", process.pid);
	Logger.debugln("args: ", Globals.args);
	Logger.debugln("flags: ", Globals.flags);
}

switch (Globals.flags.get("user")) {
	case "debugger":
		LokeBot.TOKEN = auth.DEBUG_TOKEN;
		break;
	case "default":
	default:
		LokeBot.TOKEN = auth.TOKEN;
}

let preExitHook = async (signal: string | number) => {
	Logger.println("Signal/exit code:", signal);

	return new Promise<void>(async resolve => {
		await bot.exit();
		process.exit(0);
		resolve();
	});
};

process.on("exit", async code => {
	await preExitHook(code);
});
process.on("beforeExit", async code => {
	await preExitHook(code);
});
process.on("SIGINT", async signal => {
	await preExitHook(signal);
});
process.on("SIGTERM", async signal => {
	await preExitHook(signal);
});
process.on("SIGHUP", async signal => {
	await preExitHook(signal);
});
process.on("SIGBREAK", async signal => {
	await preExitHook(signal);
});

let botOpts: LokeBotOpts = {};
if (Globals.flags.isTrue("useTestDb")) {
	botOpts.useTestDb = true;
}
bot = new LokeBot(botOpts);
bot.start();

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.on("SIGINT", async () => {
	await preExitHook("(stdin):SIGINT");
});
