import LokeBot from "LokeBot";

export function init(bot: LokeBot) {

    bot.client.on("message", msg => {

		// you just activated my trap card...
		let result = msg.content.match(/[^a-zA-Z]?no u[^a-zA-Z]?/mi);
		if (result != null) {
			let imgs = [
				"https://i.imgur.com/oqn5SGO.png",
				"https://i.imgur.com/UzUz6yi.jpg",
				"https://i.imgur.com/tCCmdp6.png"
			]
			let i = ~~(Math.random() * imgs.length);
			msg.reply({ file: imgs[i] });
		}

	});
    
}