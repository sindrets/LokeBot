import fs from "fs";
import path from "path";
import LokeBot from "./LokeBot";

export function initBehaviour(bot: LokeBot): void {

	let files = fs.readdirSync(path.join(__dirname, "behaviour"));
	files.forEach(file => {
		require(`./behaviour/${file}`).init(bot);
	})
	
}