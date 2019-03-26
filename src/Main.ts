// set custom import paths
process.env.NODE_PATH = __dirname;
require("module").Module._initPaths();

import LokeBot from "./LokeBot";
import { FlagParser } from "FlagParser";
import { TestRunner } from "tests/testRunner";
import { Logger } from "Logger";

let args = process.argv.slice(2);
let flags = FlagParser.parseFlags(args, false);

if (flags.isTrue("debug")) {
    LokeBot.DEBUG_MODE = true;
    Logger.debugln("Running in debug mode!");
    Logger.debugln("args: " + args);
    Logger.debugln("flags: " + flags);
}

if (flags.isTrue("test")) {
    new TestRunner(args, flags);
}
else {
    const bot = new LokeBot(args, flags);
    bot.start();
}