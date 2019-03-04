import { MongoClient, Db, Collection, InsertOneWriteOpResult, WriteOpResult, UpdateWriteOpResult } from "mongodb";
import { sprintf } from "sprintf-js";
import assert from "assert";
import auth from "./auth.json";
import { EventHandler } from "./EventHandler.js";
import { BotEvent } from "./Constants.js";
import { LokerStatDoc } from "./Interfaces.js";

export class DbRemote {

	private readonly uri: string;
	private readonly dbName: string;

	private dbClient: MongoClient | undefined;
	private db: Db | undefined;
	private lokeStats: Collection | undefined;
	private connected: boolean = false;

	constructor() {
		this.uri = sprintf(auth.SRV_ADDRESS, auth.DB_U, auth.DB_P);
		this.dbName = auth.DB_NAME;
	}

	public connect(): void {
		MongoClient.connect(this.uri, {useNewUrlParser: true}, (err, dbClient) => {
			assert.strictEqual(err, null);
			if (err) console.error(err.errmsg);
			console.log("Successfully connected to server!");

			this.dbClient = dbClient;
			this.db = dbClient.db(this.dbName);
			this.lokeStats = this.db.collection("lokeStats");
			this.connected = true;
			EventHandler.trigger(BotEvent.CONNECTED);
		});
	}

	public insertOneLoker(userTag: string, callback?: (result: InsertOneWriteOpResult) => void): void {
		if (this.lokeStats) {
			this.lokeStats.insertOne({ user: userTag, meanderDays: [] }, (err, result) => {
				if (callback) callback(result);
			});
		}
	}

	public getOneLokerStats(userTag: string, callback?: (doc: LokerStatDoc | null) => void): void {
		if (this.lokeStats) {
			this.lokeStats.findOne({ user: userTag }, (err, doc) => {
				if (callback) callback(doc);
			});
		}
	}

	public getAllLokerStats(callback?: (doc: LokerStatDoc[] | null) => void): void {
		if (this.lokeStats) {
			this.lokeStats.find({}).toArray((err, doc) => {
				if (callback) callback(doc);
			});
		}
	}

	public addLokeDay(userTag: string, date?: Date, callback?: (result: UpdateWriteOpResult) => void): void {
		this.getOneLokerStats(userTag, (doc) => {
			if (!doc) {
				this.insertOneLoker(userTag, (result) => {
					this.addLokeDay(userTag, date, callback);
				});
				return;
			} else if (this.lokeStats) {
				if (date == undefined) date = new Date();
				doc.meanderDays.push(date);
				this.lokeStats.replaceOne( { user: userTag }, doc, (err, result) => {
					if (callback) callback(result);
				});
			}
		});
	}

	public getDb(): Db | undefined {
		return this.db;
	}

	public isConnected(): boolean {
		return this.connected;
	}

	public async closeConnection(): Promise<void> {
		if (this.dbClient) {
			return this.dbClient.close();
		}
		return new Promise<void>((resolve, reject) => { resolve() });
	}
	
}