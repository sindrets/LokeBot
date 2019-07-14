import { BotEvent } from "./Constants";

type EventIdentifier = string | BotEvent;

class EventSubscription {
	once: boolean;
	emitted: boolean = false;
	requirements: EventIdentifier[];
	callback: (...args: any[]) => any;

	constructor(requirements: EventIdentifier[], callback: (...args: any[]) => any, once = false) {
		this.once = once;
		this.requirements = requirements;
		this.callback = callback;
		if (this.once) {
			// if once event: ping in case requirements are already met
			this.ping();
		}
	}

	public ping(...args: any[]) {
		if (this.once) {
			if (!this.emitted && EventHandler.requirementsMet(this.requirements)) {
				this.emitted = true;
				this.callback(...args);
			}
		}
		else {
			this.emitted = true;
			this.callback(...args);
		}
	}
}

class EventObject {
	id: EventIdentifier;
	emitted = false;
	subscriptions: EventSubscription[];

	constructor(id: EventIdentifier, subscriptions?: EventSubscription[], emitted = false) {
		this.id = id;
		this.emitted = emitted;
		this.subscriptions = subscriptions ? subscriptions : [];
	}

	public addSubscription(subscription: EventSubscription) {
		this.subscriptions.push(subscription);
	}

	public emit(...args: any[]) {
		this.emitted = true;
		this.subscriptions.forEach(s => {
			s.ping(...args);
		})
	}
}

export class EventHandler {

	private static eventDict: Map<EventIdentifier, EventObject> = new Map();
	private static subscriptions: EventSubscription[] = [];

	private static add(event: string | BotEvent | (string | BotEvent)[], listener: (...args: any[]) => any, once = false): EventSubscription {

		let eventList: EventIdentifier[] = [];
		if (event instanceof Array) {
			event.forEach(e => {
				eventList.push(String(e));
			});
		}
		else eventList.push(String(event));

		let subscription = new EventSubscription(eventList, listener, once);
		EventHandler.subscriptions.push(subscription);

		eventList.forEach(e => {
			let eventEntry = EventHandler.eventDict.get(e);
			if (eventEntry === undefined) {
				EventHandler.eventDict.set(e, new EventObject(e, [subscription]));
			}
			else {
				eventEntry.addSubscription(subscription);
			}
		});

		return subscription;
		
	}

	/**
	 * Adds a subscription to one or more events. The listener is called whenever any of the given events are triggered.
	 * @param event Either one, or an array of event identifiers. If an array is provided, the listener is called 
	 * whenever any of the given events are triggered.
	 * @param listener A callback that is called whenever the event is triggered.
	 */
	public static on(event: string | BotEvent | (string | BotEvent)[], listener: (...args: any[]) => any): void {
		EventHandler.add(event, listener);
	}

	/**
	 * Adds a subscription to one or more events. The listener is called only the first time the event is triggered. If
	 * the event requirements are already met upon subscribing; the listener is called immediately.
	 * @param event Either one, or an array of event identifiers. If an array is provided, the listener is called only 
	 * after ___all___ the events have been triggered.
	 * @param listener A callback that is called the first time the event is triggered.
	 */
	public static once(event: string | BotEvent | (string | BotEvent)[], listener: (...args: any[]) => any): void {
		EventHandler.add(event, listener, true);
	}

	/**
	 * Trigger an event.
	 * @param event The event identifier of the target event.
	 * @param args Args to pass to any possible event listeners.
	 */
	public static trigger(event: string | BotEvent, ...args: any[]): void {

		let eventEntry = EventHandler.eventDict.get(String(event));
		if (eventEntry !== undefined) {
			eventEntry.emit(...args);
		}
		else {
			EventHandler.eventDict.set(String(event), new EventObject(event, [], true));
		}
		
	}

	/**
	 * Checks whether all the given events have been triggered.
	 * @param requirements 
	 */
	static requirementsMet(requirements: EventIdentifier[]): boolean {

		let result = true;
		requirements.some(name => {
			let eventEntry = EventHandler.eventDict.get(name);
			if (eventEntry !== undefined) {
				if (!eventEntry.emitted) {
					result = false;
					return true;
				}
				else return false;
			}
			// event has not been added.
			result = false;
			return true;
		})

		return result;
		
	}

}
