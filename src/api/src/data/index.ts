import * as knex from "knex";
import { DB_CONFIG, DB_NAME } from "../config";

export const db = knex.knex(DB_CONFIG);

console.log("DB_CONFIG:", DB_CONFIG)
