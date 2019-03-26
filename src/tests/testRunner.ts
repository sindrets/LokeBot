// set custom import paths
process.env.NODE_PATH = require("path").resolve(__dirname, "..");
require("module").Module._initPaths();

import { Logger } from "Logger";
import { FlagParser } from "FlagParser";

export class TestRunner {

	constructor(args: string[], flags: FlagParser) {

		if (args.length < 1) {
			Logger.println("No test was specified!");
		} else {
			args.forEach((value, index, args) => {
				require("./" + value);
			})
		}
		
	}
	
}
