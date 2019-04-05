// set custom import paths
process.env.NODE_PATH = __dirname;
require("module").Module._initPaths();

import fs from "fs";
import path from "path";

if (!fs.existsSync(path.join(__dirname, "auth.json"))) {
    fs.copyFileSync(path.join(__dirname, "auth-TEMPLATE.json"), path.join(__dirname, "auth.json"));
}

import auth from "auth.json";
import { FlagParser } from "FlagParser";
import { Globals } from "Globals";
import { Logger } from "Logger";
import { TestRunner } from "tests/testRunner";
import LokeBot from "./LokeBot";

Globals.args = process.argv.slice(2);
Globals.flags = FlagParser.parse(Globals.args, false);

if (Globals.flags.isTrue("debug")) {
    Globals.DEBUG_MODE = true;
    Logger.debugln("Running in debug mode!");
    Logger.debugln("args: " + Globals.args);
    Logger.debugln("flags: " + Globals.flags);
}

switch (Globals.flags.get("user")) {
    case "debugger":
        LokeBot.TOKEN = auth.DEBUG_TOKEN;
        break;
    case "default":
    default:
        LokeBot.TOKEN = auth.TOKEN;
}

// global variables
var bot: LokeBot;
var BotGlobals = Globals;

if (Globals.flags.isTrue("test")) {
    new TestRunner();
}
else {
    bot = new LokeBot();
    bot.start();
}