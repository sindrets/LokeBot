import { Message } from "discord.js";

export class UserError {

	private _name: string;
	private _message: string;
	private _msg: Message;

	public constructor(name: string, message: string, msg: Message) {
		this._name = name;
		this._message = message;
		this._msg = msg;
		msg.reply(this.toString());
	}

	public toString() {
		return `\`${this.name}: ${this.message}\``;
	}

	public get name() {
		return this._name;
	}

	public get message() {
		return this._message;
	}

	public get msg() {
		return this._msg;
	}
	
}