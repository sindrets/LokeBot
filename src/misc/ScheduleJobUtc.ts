import cronParser from "cron-parser";
import { CronFields } from "Interfaces";
import { Logger } from "Logger";
import moment, { Moment } from "moment-timezone";
import schedule, { Job } from "node-schedule";
import { Utils } from "./Utils";

export type RecurrenceDef = number | number[] | TimeRange;

export interface JobSpec {
    year?: RecurrenceDef, 
    month?: RecurrenceDef, 
    date?: RecurrenceDef,
    hour?: RecurrenceDef, 
    minute?: RecurrenceDef, 
    second?: RecurrenceDef, 
    dayOfWeek?: RecurrenceDef
}

export class TimeRange {

    public start: number;
    public end: number;
    public step: number;

    constructor(start: number, end: number, step=1) {
        this.start = start;
        this.end = end;
        this.step = step;
    }
    
}

/**
 * Create a scheduled job with a utc offset.
 * @param name The name of the schedule job.
 * @param interval Either a JobSpec object or a Cron expression. 
 * @param timezone An IANA timezone name.
 * @param callback The callback to be executed on the job trigger.
 */
export function scheduleJobUtc(name: string, interval: JobSpec | string, timezone: string, callback: () => void): Job | null
/**
 * Create a scheduled job with a utc offset.
 * @param name The name of the schedule job.
 * @param interval Either a JobSpec object or a Cron expression. 
 * @param utcOffset Utc offset in minutes.
 * @param callback The callback to be executed on the job trigger.
 */
export function scheduleJobUtc(name: string, interval: JobSpec | string, utcOffset: number, callback: () => void): Job | null
export function scheduleJobUtc(name: string, interval: JobSpec | string, utcOrTz: number | string, callback: () => void): Job | null {
    
    let options: JobSpec;
    if (typeof interval == "string") {
        let cronInterval: any;
            try { cronInterval = cronParser.parseExpression(interval); }
            catch (err) {
                Logger.error("Invalid cron expression: " + interval);
                return null;
            }
    
            let fields: CronFields = cronInterval._fields;
            options = {
                second: fields.second, 
                minute: fields.minute, 
                hour: fields.hour, 
                date: fields.dayOfMonth, 
                dayOfWeek: fields.dayOfWeek
            }
    }
    else options = interval;

    let utcOffset = 0;
    if (typeof utcOrTz == "string") {
        utcOffset = moment.utc().tz(utcOrTz).utcOffset();
    }

    let valueToArray = (value?: number | number[] | TimeRange): number[] => {
        
        let result: number[] = [];

        if (value == undefined) return result;
        if (typeof value == "number") return [value];
        if (value instanceof Array) return value;
        else {
            for (let i = 0; i < value.end; i += value.step) {
                result.push(value.start + i);
            }
        }

        return result;

    }

    if (options.second == undefined) options.second = 0;

    let values = {
        year: valueToArray(options.year),
        month: valueToArray(options.month),
        date: valueToArray(options.date),
        hour: valueToArray(options.hour),
        minute: valueToArray(options.minute),
        second: valueToArray(options.second),
        dayOfWeek: valueToArray(options.dayOfWeek)
    }

    let t0: Moment;
    let t1: Moment = moment.utc();

    if (options.year != undefined) t1.set("year", values.year[0]);
    if (options.month != undefined) t1.set("month", values.month[0]);
    if (options.date != undefined) t1.set("date", values.date[0]);
    if (options.hour != undefined) t1.set("hour", values.hour[0]);
    if (options.minute != undefined) t1.set("minute", values.minute[0]);
    if (options.second != undefined) t1.set("second", values.second[0]);

    let currentOffset = new Date().getTimezoneOffset();
    t0 = t1.clone();
    t1.add((-currentOffset - utcOffset), "minutes");

    let diffs: { [key: string]: number } = {

        year: (() => {
            let t2 = t0.clone().set("months", 0).set("date", 1).set("hours", 0).set("minutes", 0).set("seconds", 0);
            let t3 = t1.clone().set("months", 0).set("date", 1).set("hours", 0).set("minutes", 0).set("seconds", 0);
            return t3.diff(t2, "years", true);
        })(),

        month: (() => {
            let t2 = t0.clone().set("date", 1).set("hours", 0).set("minutes", 0).set("seconds", 0);
            let t3 = t1.clone().set("date", 1).set("hours", 0).set("minutes", 0).set("seconds", 0);
            return t3.diff(t2, "months", true);
        })(),

        date: (() => {
            let t2 = t0.clone().set("hours", 0).set("minutes", 0).set("seconds", 0);
            let t3 = t1.clone().set("hours", 0).set("minutes", 0).set("seconds", 0);
            return t3.diff(t2, "days", true);
        })(),

        hour: (() => {
            let t2 = t0.clone().set("minutes", 0).set("seconds", 0);
            let t3 = t1.clone().set("minutes", 0).set("seconds", 0);
            return t3.diff(t2, "hours", true);
        })(),

        minute: (() => {
            let t2 = t0.clone().set("year", 2000).set("months", 0).set("date", 1).set("hours", 0).set("seconds", 0);
            let t3 = t1.clone().set("year", 2000).set("months", 0).set("date", 1).set("hours", 0).set("seconds", 0);
            return t3.diff(t2, "minutes", true);
        })(),

        second: (() => {
            let t2 = t0.clone().set("year", 2000).set("months", 0).set("date", 1).set("hours", 0).set("minutes", 0);
            let t3 = t1.clone().set("year", 2000).set("months", 0).set("date", 1).set("hours", 0).set("minutes", 0);
            return t3.diff(t2, "seconds", true);
        })(),

        dayOfWeek: (() => {
            let t2 = t0.clone().set("hours", 0).set("minutes", 0).set("seconds", 0);
            let t3 = t1.clone().set("hours", 0).set("minutes", 0).set("seconds", 0);
            return t3.diff(t2, "days", true);
        })()

    }

    Utils.objForEach(values, (v, k) => {

        let value: number[] = v;
        let key: string = k;
        let t2 = t0.clone();

        if (key != "dayOfWeek") {
            value.forEach((time, index) => {
                value[index] = t2.set(key as any, time + diffs[key]).get(key as any);
            })
        }
        else {
            //dayOfWeek
            value.forEach((time, index) => {
                value[index] = (time + diffs[key]) % 7;
            })
        }

    })

    let rule = new schedule.RecurrenceRule();
    if (options.year != undefined) rule.year = values.year;
    if (options.month != undefined) rule.month = values.month;
    if (options.date != undefined) rule.date = values.date;
    if (options.hour != undefined) rule.hour = values.hour;
    if (options.minute != undefined) rule.minute = values.minute;
    if (options.second != undefined) rule.second = values.second;
    if (options.dayOfWeek != undefined) rule.dayOfWeek = values.dayOfWeek;

    return schedule.scheduleJob(name, rule, callback);

}

export function printNextInvocations(): void {

    for (let job in schedule.scheduledJobs) {
        Logger.info(`Job <${job}> next invocation: ` + schedule.scheduledJobs[job].nextInvocation());
    }

}