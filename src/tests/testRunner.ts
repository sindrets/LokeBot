import { Logger } from "Logger";
import { Globals } from "Globals";

export class TestRunner {

	constructor() {

		if (Globals.args.length < 1) {
			Logger.println("No test was specified!");
		} else {
			Globals.args.forEach((value, index, args) => {
				require("./" + value);
			})
		}
		
	}
	
}
