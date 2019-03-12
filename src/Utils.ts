import moment = require("moment");

export class Utils {

	private static uidCounter: number = 0;

	/**
	 * Returns a new Unique ID.
	 */
	public static getUid(): number {
		return Utils.uidCounter++;
	}

	/** Converts degrees to radians */
	public static toRadians(degrees: number): number {
		return degrees * Math.PI / 180;
	}

	/** Converts radians to degrees */
	public static toDegrees(radians: number): number {
		return radians * 180 / Math.PI;
	}

	/** Return the difference between two values */
	public static dif(a: number, b: number): number {
		return Math.abs(a - b);
	}
	
	/** Return the value if it belongs between the given range. Otherwise
	return the closest of the extremes. */
	public static clamp(value: number, min: number, max: number): number {
		if (max < min) {
			console.warn("Clamp was called with a max value less than the min value!")
			max = min;
		}
		if (value < min) return min;
		if (value > max) return max;
		return value;
	}

	/** Returns true if the two ranges overlap */
	public static rangeIntersect(min0: number, max0: number, min1: number, max1: number): boolean {
		return Math.max(min0, max0) >= Math.min(min1, max1) &&
			   Math.min(min0, max0) <= Math.max(min1, max1);
	}

	/** Returns true if both numbers have the same sign */
	public static sameSign(a: number, b: number): boolean {
		return (a * b) >= 0;
	}
	
	/** Linearly interpolate between a and b.
	 * Weight t should be in the range [0.0, 1.0] */
	public static lerp(a: number, b: number, t: number): number {
		return (1.0 - t) * a + t * b;
	}
	
	/** Splice and return the first element from an array. */
	public static spliceFirst(array: Array<any>): any {
		return array.splice(0, 1)[0];
	}

	/** Splice and return the last element from an array. */
	public static spliceLast(array: Array<any>): any {
		return array.splice(array.length - 1, 1)[0];
	}

	/**
	 * Returns a float between 0 and 1 inclusive, as a logistic function of t.
	 * @param t Time progression. Should be a float between 0 and 1, inclusive.
	 * @param a Horizontal offset. Should be a positive number for sensical results.
	 * @param b Curvature. Setting this to 0 results in a linear function.
	 */
	public static logisticProgression(t: number, a: number, b: number): number {
		let f_t = 1 / (1 + a * Math.E**(-b * (t-0.5)*2));
		let f_1 = 1 / (1 + a * Math.E**(-b));
		let f_0 = 1 / (1 + a * Math.E**b);
		let g_t = f_t + (1 - f_1);
		let g_0 = f_0 + (1 - f_1);
		return g_t - (g_0 * (1 - t));
	}

	public static weightedSine(t: number, a: number, b: number): number {
		// f(x) = sin((x - 0.5) π) / 2 + 0.5
		// p(x) = -(-x + 1)^a + 1
		// g(x) = f(p(x))^b
		let p_t = -((-t + 1)**a) + 1;
		return (Math.sin((p_t - 0.5) * Math.PI) / 2 + 0.5)**b;
	}

	public static cutStr(text: string, index: number, deleteCount: number): string {
		return text.substr(0, index) + text.substr(index + deleteCount);
	}

	public static cutString(text: string, start: number, end: number): string {
		return text.substr(0, start) + text.substr(end);
	}

	public static getObjKey(enumerator: any, value: any): any {

		let result = null;
		Object.keys(enumerator).some(key => {
			let stop = false;
			if (enumerator[key] === value) {
				result = key;
				stop = true;
			}
			return stop;
		})

		return result;
		
	}

	public static objForEach(enumerator: any, callback: (value: any, key: any, obj: any) => void): void {
		Object.keys(enumerator).forEach(key => {
			callback(enumerator[key], key, enumerator);
		});
	}

	public static getDatesInPeriod(dates: Date[], period: "year", isoIndex: number): Date[];
	public static getDatesInPeriod(dates: Date[], period: "month", isoIndex: number): Date[];
	public static getDatesInPeriod(dates: Date[], period: "week", isoIndex: number): Date[];
	public static getDatesInPeriod(dates: Date[], period: string, isoIndex: number): Date[] {
		
		let result: Date[] = [];

		dates.forEach(date => {
			switch (period) {
	
				case "week":
					if (moment(date).isoWeek() == isoIndex) {
						result.push(date);
					}
					break;
	
				case "month":
					if (moment(date).month() + 1 == isoIndex) {
						result.push(date);
					}
					break;
	
				case "year":
					if (moment(date).year() == isoIndex) {
						result.push(date);
					}
					break;
				
			}
		})

		return result;
		
	}
	
}