
import { MongoClient } from "mongodb";
import { sprintf } from "sprintf-js";
import assert from "assert";
import auth from "../auth.json";

const uri: string = sprintf(auth.SRV_ADDRESS, auth.DB_U, auth.DB_P);
const dbName: string = auth.DB_NAME;

MongoClient.connect(uri, (error, dbClient) => {
	assert.strictEqual(error, null);
	console.log("Connected successfully to server!");

	const db = dbClient.db(dbName);

	dbClient.close();
});