import assert from "assert";
import { Collection, Db, InsertOneWriteOpResult, MongoClient, MongoError, UpdateWriteOpResult } from "mongodb";
import { sprintf } from "sprintf-js";
import auth from "./auth.json";
import { BotEvent } from "./Constants.js";
import { EventHandler } from "./EventHandler.js";
import { LokerStatDoc, LokerStateDoc } from "./Interfaces.js";
import { Utils } from "./Utils.js";
import { Logger } from "Logger.js";

export class DbRemote {

	private readonly uri: string;
	private readonly dbName: string;

	private dbClient: MongoClient | undefined;
	private db: Db | undefined;
	private lokeStats: Collection | undefined;
	private lokeState: Collection | undefined;
	private quotes: Collection | undefined;
	private connected: boolean = false;

	constructor() {
		this.uri = sprintf(auth.SRV_ADDRESS, auth.DB_U, auth.DB_P);
		this.dbName = auth.DB_NAME;
	}

	/**
	 * Connect to the database and fetch relevant collections.
	 */
	public connect(): void {
		MongoClient.connect(this.uri, {useNewUrlParser: true}, (err, dbClient) => {
			assert.strictEqual(err, null);
			if (err) Logger.error(err.errmsg);
			Logger.success("Successfully connected to the database!");

			this.dbClient = dbClient;
			this.db = dbClient.db(this.dbName);
			this.lokeStats = this.db.collection("lokeStats");
			this.lokeState = this.db.collection("lokeStatus");
			this.quotes = this.db.collection("quotes");
			this.connected = true;
			EventHandler.trigger(BotEvent.CONNECTED, true);
		});
	}

	/**
	 * Insert a LokerStatDoc document for a single user.
	 * @param userTag 
	 * @param callback 
	 */
	public insertLokerSingle(userTag: string, callback?: (err: MongoError, result: InsertOneWriteOpResult) => void): void {
		if (this.lokeStats) {
			this.lokeStats.insertOne({ user: userTag, meanderDays: [] }, (err, result) => {
				if (callback) callback(err, result);
			});
		}
	}

	/**
	 * Insert a LokerStateDoc document for a single user.
	 * @param userTag 
	 * @param state 
	 * @param callback 
	 */
	public insertStateSingle(userTag: string, state: boolean, callback?: (err: MongoError, result: InsertOneWriteOpResult) => void): void {
		
		if (this.lokeState) {
			this.lokeState.insertOne({ user: userTag, state: state }, (err, result) => {
				if (callback) callback(err, result);
			})
		}

	}

	/**
	 * Get loke-stats for a single user.
	 * @param userTag 
	 * @param callback 
	 * @param sortDates If true: sort dates in a descending order.
	 */
	public getStatsSingle(userTag: string, callback?: (doc: LokerStatDoc | null, err: MongoError) => void, sortDates=false): void {
		if (this.lokeStats) {
			this.lokeStats.findOne({ user: userTag }, (err, doc) => {
				if (doc && sortDates) {
					// sort dates descending
					(doc as LokerStatDoc).meanderDays.sort((a,b) => {
						if (a < b) return 1;
						if (a > b) return -1;
						return 0;
					})
				}
				if (callback) callback(doc, err);
			});
		}
	}

	/**
	 * Get loke-stats for all users.
	 * @param callback 
	 * @param sortDates If true: sort dates in a descending order
	 */
	public getStatsAll(callback?: (docs: LokerStatDoc[] | null, err: MongoError) => void, sortDates=false): void {
		if (this.lokeStats) {
			this.lokeStats.find().toArray((err, docs) => {
				if (docs && sortDates) {
					(docs as LokerStatDoc[]).forEach(obj => {
						// sort dates descending
						(obj.meanderDays as Date[]).sort((a,b) => {
							if (a < b) return 1;
							if (a > b) return -1;
							return 0;
						})
					})
				}
				if (callback) callback(docs, err);
			});
		}
	}

	/**
	 * Get loke-state of a single user.
	 * @param userTag 
	 * @param callback 
	 */
	public getStateSingle(userTag: string, callback?: (doc: LokerStateDoc | null, err: MongoError) => void): void {
		
		if (this.lokeState) {
			this.lokeState.findOne({ user: userTag }, (err, doc) => {
				if (callback) callback(doc, err);
			});
		}
		
	}

	/**
	 * Get loke-state of all users.
	 * @param callback 
	 */
	public getStateAll(callback?: (docs: LokerStateDoc[] | null, err: MongoError) => void): void {
		
		if (this.lokeState) {
			this.lokeState.find().toArray((err, doc) => {
				if (callback) callback(doc, err);
			});
		}
		
	}

	/**
	 * Get loke-stats for one user during a specified period.
	 * @param userTag 
	 * @param period The period length
	 * @param isoIndex An ISO 8601 period index such that:
	 *  - 1 = Monday / January / AD 1
	 *  - 7 = Sunday / July / AD 7
	 * 
	 * For details on the ISO date format: https://en.wikipedia.org/wiki/ISO_8601
	 * @param callback 
	 */
	public getStatsPeriodSingle(userTag: string, period: "year" | "month" | "week", isoIndex: number, callback: (doc: LokerStatDoc | null, err: MongoError) => void): void {
		
		this.getStatsSingle(userTag, (doc, err) => {
			if (doc) {
				doc.meanderDays = Utils.getDatesInPeriod(doc.meanderDays, period, isoIndex);
				callback(doc, err);
			}
		}, true);
		
	}

	/**
	 * Get loke-stats for all users during a specified period.
	 * @param period The period length
	 * @param isoIndex An ISO 8601 period index such that:
	 *  - 1 = Monday / January / AD 1
	 *  - 7 = Sunday / July / AD 7
	 * 
	 * For details on the ISO date format: https://en.wikipedia.org/wiki/ISO_8601
	 * @param callback 
	 */
	public getStatsPeriodAll(period: "year" | "month" | "week", isoIndex: number, callback: (docs: LokerStatDoc[] | null, err: MongoError) => void): void {
		
		this.getStatsAll((docs, err) => {
			if (docs) {
				docs.forEach(doc => {
					doc.meanderDays = Utils.getDatesInPeriod(doc.meanderDays, period, isoIndex);
				})

				callback(docs, err);
			}
		
		}, true);
		
	}

	/**
	 * Add a loke-day to a single user.
	 * @param userTag 
	 * @param date 
	 * @param callback 
	 */
	public addDaySingle(userTag: string, date?: Date, callback?: (err: MongoError, result: UpdateWriteOpResult | null) => void): void {
		this.getStatsSingle(userTag, (doc, err) => {
			if (err != null) {
				if (callback) callback(err, null);
				return; // prevent infinite recursion 
			}
			if (!doc) {
				this.insertLokerSingle(userTag, (result) => {
					this.addDaySingle(userTag, date, callback);
				});
				return;
			} else if (this.lokeStats) {
				if (date == undefined) date = new Date();
				doc.meanderDays.push(date);
				this.lokeStats.replaceOne( { user: userTag }, doc, (err, result) => {
					if (callback) callback(err, result);
				});
			}
		});
	}

	/**
	 * Set loke-state for a single user. 
	 * @param userTag 
	 * @param state True if the user is to be marked as Loker
	 * @param callback 
	 */
	public setStateSingle(userTag: string, state: boolean, callback?: (err: MongoError, result: UpdateWriteOpResult | InsertOneWriteOpResult) => void): void {
		
		this.getStateSingle(userTag, doc => {
			
			if (!doc) {
				this.insertStateSingle(userTag, state, (err, result) => {
					if (callback) callback(err, result);
				});
			} else if (this.lokeState) {
				doc.state = state;
				this.lokeState.replaceOne({ user: userTag }, doc, (err, result) => {
					if (callback) callback(err, result);
				});
			}
			
		});
		
	}

	/**
	 * Set loke-state for all users.
	 * @param state True if the users are to be marked as Loker
	 * @param callback 
	 */
	public setStateAll(state: boolean, callback?: (err: MongoError, result: UpdateWriteOpResult) => void): void {
		
		this.getStateAll(docs => {

			if (docs) {
				docs.forEach(doc => {
					doc.state = state;
					if (this.lokeState) this.lokeState.replaceOne({ user: doc.user }, doc, (err, result) => {
						if (callback) callback(err, result);
					})
				})
			}
			
		})
		
	}

	public getDb(): Db | undefined {
		return this.db;
	}

	public isConnected(): boolean {
		return this.connected;
	}

	/**
	 * Close the connection to the database.
	 */
	public async closeConnection(): Promise<void> {
		if (this.dbClient) {
			return this.dbClient.close();
		}
		return new Promise((resolve, reject) => { resolve() });
	}
	
}