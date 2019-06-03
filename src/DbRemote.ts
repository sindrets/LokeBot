import { User } from "discord.js";
import { Logger } from "Logger";
import { Collection, Db, InsertOneWriteOpResult, MongoClient, MongoError, ReplaceWriteOpResult, UpdateWriteOpResult, DeleteWriteOpResultObject } from "mongodb";
import { sprintf } from "sprintf-js";
import auth from "./auth.json";
import { BotEvent } from "./Constants";
import { EventHandler } from "./EventHandler";
import { LokerStatDoc, ExceptionDoc } from "./Interfaces";
import { Utils } from "./misc/Utils";

export class DbRemote {

	private readonly uri: string;
	private readonly dbName: string;

	private dbClient?: MongoClient;
	private db?: Db;
	private lokeStats?: Collection;
	private exceptions?: Collection;
	private quotes?: Collection;
	private connected: boolean = false;

	constructor() {
		this.uri = sprintf(auth.SRV_ADDRESS, auth.DB_U, encodeURI(auth.DB_P));
		this.dbName = auth.DB_NAME;
	}

	/**
	 * Connect to the database and fetch relevant collections.
	 */
	public async connect(): Promise<Db> {

		return new Promise((resolve, reject) => {

			MongoClient.connect(this.uri, {useNewUrlParser: true}, (err, dbClient) => {

				// assert.strictEqual(err, null);
				if (err) {
					Logger.error(err.errmsg);
					reject(err);
					return;
				}
				Logger.success("Successfully connected to the database!");
	
				this.dbClient = dbClient;
				this.db = dbClient.db(this.dbName);
				this.lokeStats = this.db.collection("lokeStats");
				this.exceptions = this.db.collection("exceptions");
				this.quotes = this.db.collection("quotes");
				this.connected = true;
				EventHandler.trigger(BotEvent.CONNECTED, true);

				resolve(this.db);

			});

		})
	}

	/**
	 * Insert a LokerStatDoc document for a single user.
	 * @param user 
	 * @param callback 
	 */
	public insertLokerSingle(user: User, callback?: (err: MongoError, result: InsertOneWriteOpResult) => void): void
	/**
	 * Insert a LokerStatDoc document for a single user.
	 * @param user
	 * @param state Loke state 
	 * @param callback 
	 */
	public insertLokerSingle(user: User, state: boolean, callback?: (err: MongoError, result: InsertOneWriteOpResult) => void): void
	public insertLokerSingle(user: User, callbackOrState: boolean | Function | unknown, callback?: (err: MongoError, result: InsertOneWriteOpResult) => void): void {

		if (this.lokeStats) {

			let flag = typeof callbackOrState == "boolean" ? callbackOrState : false;
			let listener = typeof callbackOrState == "function" ? callbackOrState : callback;

			this.lokeStats.insertOne({uid: user.id, user: user.tag, state: flag, meanderDays: [] } as LokerStatDoc, (err, result) => {
				if (listener) listener(err, result);
			});
		}

	}

	public insertExceptionSingle(periodStart: Date, periodEnd: Date, callback?: (err: MongoError, result: InsertOneWriteOpResult) => void) {

		if (this.exceptions) {

			this.exceptions.insertOne({ periodStart: periodStart, periodEnd: periodEnd }, (err, result) => {
				if (callback) callback(err, result);
			});
			
		}
		
	}

	public deleteExceptionSingle(id: string, callback?: (err: MongoError, result: DeleteWriteOpResultObject) => void) {

		if (this.exceptions) {

			this.exceptions.deleteOne({ _id: id }, (err, result) => {
				if (callback) callback(err, result);
			});
			
		}
		
	}

	/**
	 * Update a document for a single user.
	 * @param uid User id.
	 * @param doc 
	 * @param callback 
	 */
	public updateLokerSingle(uid: string, doc: LokerStatDoc, callback?: (err: MongoError, result: ReplaceWriteOpResult) => void): void
	/**
	 * Update a document for a single user.
	 * @param user 
	 * @param doc 
	 * @param callback 
	 */
	public updateLokerSingle(user: User, doc: LokerStatDoc, callback?: (err: MongoError, result: ReplaceWriteOpResult) => void): void
	public updateLokerSingle(userOrUid: User | string, doc: LokerStatDoc, callback?: (err: MongoError, result: ReplaceWriteOpResult) => void): void {
		
		if (this.lokeStats) {

			let id = typeof userOrUid == "string" ? userOrUid : userOrUid.id;

			this.lokeStats.replaceOne({ uid: id }, doc, (err, result) => {
				if (callback) callback(err, result);
			});
			
		}
		
	}

	/**
	 * Get loke-stats for a single user.
	 * @param user 
	 * @param callback 
	 * @param sortDates If true: sort dates in a descending order.
	 */
	public getStatsSingle(user: User, callback?: (doc: LokerStatDoc | null, err: MongoError) => void, sortDates=false): void {
		if (this.lokeStats) {
			this.lokeStats.findOne({ uid: user.id }, (err, doc) => {
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
	 * Get loke-stats for one user during a specified period.
	 * @param user 
	 * @param period The period length
	 * @param isoIndex An ISO 8601 period index such that:
	 *  - 1 = Monday / January / AD 1
	 *  - 7 = Sunday / July / AD 7
	 * 
	 * For details on the ISO date format: https://en.wikipedia.org/wiki/ISO_8601
	 * @param callback 
	 */
	public getStatsPeriodSingle(user: User, period: "year" | "month" | "week", isoIndex: number, callback: (doc: LokerStatDoc | null, err: MongoError) => void): void {
		
		this.getStatsSingle(user, (doc, err) => {
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

	public getExceptionAll(callback?: (docs: any[] | null, err: MongoError) => void, sortDates=false) {

		if (this.exceptions) {
			this.exceptions.find().toArray((err, docs) => {
				if (docs && sortDates) {
					(docs as ExceptionDoc[]).sort((a,b) => {
						if (a.periodStart > b.periodStart) return 1;
						if (a.periodStart < b.periodStart) return -1;
						return 0;
					})
				}
				if (callback) callback(docs, err);
			});
		}
		
	}

	/**
	 * Add a loke-day to a single user.
	 * @param user 
	 * @param date 
	 * @param callback 
	 */
	public addDaySingle(user: User, date?: Date, callback?: (err: MongoError, result: UpdateWriteOpResult | null) => void): void {
		this.getStatsSingle(user, (doc, err) => {
			if (err != null) {
				if (callback) callback(err, null);
				return; // prevent infinite recursion 
			}
			if (!doc) {
				this.insertLokerSingle(user, (result) => {
					this.addDaySingle(user, date, callback);
				});
				return;
			} else if (this.lokeStats) {
				if (date == undefined) date = new Date();
				doc.meanderDays.push(date);
				doc.user = user.tag;
				this.updateLokerSingle(user, doc, (err, result) => {
					if (callback) callback(err, result);
				});
			}
		});
	}

	/**
	 * Set loke-state for a single user. 
	 * @param user 
	 * @param state True if the user is to be marked as Loker
	 * @param callback 
	 */
	public setStateSingle(user: User, state: boolean, callback?: (err: MongoError, result: UpdateWriteOpResult | InsertOneWriteOpResult) => void): void {
		
		this.getStatsSingle(user, doc => {
			
			if (!doc) {
				this.insertLokerSingle(user, state, (err, result) => {
					if (callback) callback(err, result);
				});
			} else if (this.lokeStats) {
				doc.state = state;
				doc.user = user.tag;
				this.updateLokerSingle(user, doc, (err, result) => {
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
		
		this.getStatsAll(docs => {

			if (docs) {
				docs.forEach(doc => {
					doc.state = state;
					if (this.lokeStats) this.updateLokerSingle(doc.uid, doc, (err, result) => {
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
	public async disconnect(): Promise<void> {

		return new Promise<void>((resolve, reject) => {
            if (this.dbClient) {
                this.dbClient.close().then(
                    () => {
                        this.connected = false;
                        Logger.success("Closed connection to the database!");
                        return resolve();
                    }, reject );
            }
            else resolve();
		})
		
	}
	
}