import { Logger } from "../Logger";

Logger.enabled = false;
(console.Console as any) = function Console() {};