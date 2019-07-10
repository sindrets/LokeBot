import { EventHandler } from "../EventHandler";

test("'on' is triggered every time in single subscription.", () => {
	let i = 0;
	let event = "on-1"
	EventHandler.on(event, () => {
		i++;
	});
	EventHandler.trigger(event);
	expect(i).toEqual(1);
	EventHandler.trigger(event);
	expect(i).toEqual(2);
});

test("'on' is triggered by any event in multi subscription.", () => {
	let i = 0;
	let event1 = "on-multi-1";
	let event2 = "on-multi-2";
	EventHandler.on([event1, event2], () => {
		i++;
	});
	EventHandler.trigger(event1);
	expect(i).toEqual(1);
	EventHandler.trigger(event2);
	expect(i).toEqual(2);
});

test("'once' is triggered only once in single subscription.", () => {
	let i = 0;
	let event = "once-1";
	EventHandler.once(event, () => {
		i++;
	});
	EventHandler.trigger(event);
	expect(i).toEqual(1);
	EventHandler.trigger(event);
	expect(i).toEqual(1);
});

test("'once' is triggered only once, after requirements are met in multi subscription.", () => {
	let i = 0;
	let event1 = "once-multi-1";
	let event2 = "once-multi-2";
	EventHandler.once([event1, event2], () => {
		i++;
	});
	EventHandler.trigger(event1);
	expect(i).toEqual(0);
	EventHandler.trigger(event2);
	expect(i).toEqual(1);
	EventHandler.trigger(event1);
	expect(i).toEqual(1);
	EventHandler.trigger(event2);
	expect(i).toEqual(1);
});

test("Numbers work as event identifiers in single subscription.", () => {
	let i = 0;
	let event = 999;
	EventHandler.on(event, () => {
		i++;
	});
	EventHandler.trigger(event);
	expect(i).toEqual(1);
	EventHandler.trigger(event);
	expect(i).toEqual(2);
});

test("Numbers work as event identifiers in multi subscription.", () => {
	let i = 0;
	let event1 = 998;
	let event2 = 997;
	EventHandler.once([event1, event2], () => {
		i++;
	});
	EventHandler.trigger(event1);
	expect(i).toEqual(0);
	EventHandler.trigger(event2);
	expect(i).toEqual(1);
	EventHandler.trigger(event1);
	expect(i).toEqual(1);
	EventHandler.trigger(event2);
	expect(i).toEqual(1);
});
