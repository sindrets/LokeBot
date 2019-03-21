import { Logger } from "Logger";

if (process.argv.length < 3) {
	Logger.println("No test was specified!");
} else {
	process.argv.forEach((value, index, args) => {
		if (index >= 2)
			require("./" + value);
	})
}