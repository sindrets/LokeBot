import { BotEvent } from "./Constants";
import { EventListenerDict } from "./Interfaces";

export class EventHandler {

	private static eventListeners: EventListenerDict = {};

	/**
	 * Add an event listener.
	 * @param event Event identifier.
	 * @param listener A callback method invocated on the event trigger.
	 */
	public static on(event: string | BotEvent, listener: (...args: any[]) => void): void {
		if (!EventHandler.eventListeners[event]) EventHandler.eventListeners[event] = [];
		EventHandler.eventListeners[event].push(listener);
	}

	/**
	 * Trigger an event.
	 * @param event Event identifier.
	 * @param args Arguments passed to the listener callback.
	 */
	public static trigger(event: string | BotEvent, ...args: any[]): void {
		if (!EventHandler.eventListeners[event]) return;
		EventHandler.eventListeners[event].forEach((listener, index) => {
			listener(args);
		});
	}
	
}