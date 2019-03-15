import { BotEvent } from "./Constants";
import { EventListenerDict, OnceEventListenerDict, EventListener } from "./Interfaces";
import stringify from "stringify-object";

export class EventHandler {

	private static eventListeners: EventListenerDict = {};
	private static onceEventListeners: OnceEventListenerDict = {};

	/**
	 * Add an event listener.
	 * @param event Event identifier. If an array is provided: all the
	 * events in the array must be triggered before the provided
	 * listener is called.
	 * @param listener A callback method invocated on the event trigger.
	 * @param once Indicates that this is an event that will only be
	 * triggered once, and once triggered: any subsequent subscriptions
	 * to the event will be immediately triggered.
	 */
	public static on(event: string | BotEvent | (string | BotEvent)[], listener: (...args: any[]) => void, once=false): void {

		let eventList: string[] = [];
		if (event instanceof Array) {
			if (!once) {
				console.error("Multi-event subscriptions aren't permitted for non-singular events!");
				return;
			}
			(eventList as any[]) = event;
		}
		else eventList.push(String(event));

		eventList.forEach((e, i) => {
			let requirements = eventList.slice(0);
			requirements.splice(i, 1); // remove current event

			if (once) {
				let eventEntry = EventHandler.onceEventListeners[e]; 
				if (!eventEntry) eventEntry = EventHandler.onceEventListeners[e] = { 
					done: false, 
					args: [], 
					listeners: [] 
				};
				eventEntry.listeners.push({ requirements: requirements, callback: listener });
				if (eventEntry.done && EventHandler.requirementsMet(requirements)) {
					listener(eventEntry.args);
				}
			}
			else {
				if (!EventHandler.eventListeners[e]) EventHandler.eventListeners[e] = [];
				EventHandler.eventListeners[e].push({ requirements: requirements, callback: listener });
			}
		})

	}

	/**
	 * Trigger an event.
	 * @param event Event identifier.
	 * @param once Indicates that this event will only be triggered
	 * once, and any subsequent subscriptions to this event will be
	 * immediately triggered.
	 * @param args Arguments passed to the listener callback.
	 */
	public static trigger(event: string | BotEvent, once=false, ...args: any[]): void {
		
		if (once) {
			let eventEntry = EventHandler.onceEventListeners[event]; 
			if (!eventEntry) eventEntry = EventHandler.onceEventListeners[event] = { done: true, args: args, listeners: [] };
			else {
				// If the event has already been triggered: return
				if (eventEntry.done) return;

				// mark event as completed
				eventEntry.done = true;
				eventEntry.listeners.forEach(listener => {
					if (EventHandler.requirementsMet(listener.requirements)) 
						listener.callback(args);
				});
			}
		}
		else {
			if (!EventHandler.eventListeners[event]) return;
			EventHandler.eventListeners[event].forEach(listener => {
				if (EventHandler.requirementsMet(listener.requirements)) 
					listener.callback(args);
			});
		}
	}

	private static requirementsMet(requirements: string[]): boolean {

		let result = true;
		requirements.some(event => {
			let entry = EventHandler.onceEventListeners[event];
			if (entry && entry.done == false) {
				result = false;
				return true;
			}
			return false;
		})

		return result;
		
	}

	public static ppEventListeners(log=false): string {

		let s = stringify({ 
			eventListeners: EventHandler.eventListeners, 
			onceEventListeners: EventHandler.onceEventListeners 
		});

		if (log) console.log(s);

		return s;
		
	}
	
}