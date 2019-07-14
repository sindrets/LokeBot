(console.Console as any) = function Console() { return console };

import { Logger } from "../Logger";

Logger.enabled = false;