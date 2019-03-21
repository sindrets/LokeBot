// set custom import paths
process.env.NODE_PATH = __dirname;
require("module").Module._initPaths();

import LokeBot from "./LokeBot";
import { FlagParser } from "FlagParser";

let flags = FlagParser.parseFlags(process.argv.slice(2));
const bot = new LokeBot(flags);
bot.start();