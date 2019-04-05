import assert from "assert";
import { MongoClient } from "mongodb";
import { sprintf } from "sprintf-js";
import auth from "../auth.json";
import { Logger } from "Logger";

const uri: string = sprintf(auth.SRV_ADDRESS, auth.DB_U, auth.DB_P);
const dbName: string = auth.DB_NAME;

MongoClient.connect(uri, (error, dbClient) => {
	assert.strictEqual(error, null);
	Logger.println("Successfully connected to database!");

	const db = dbClient.db(dbName);

	dbClient.close();
});