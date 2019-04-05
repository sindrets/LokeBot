import { Utils } from "misc/Utils";

export class FlagParser extends Map<string,string> {

    /**
     * Retrieves the values of the given flags and returns true if one
     * of the values is equal to the string "true" (case-insensitive).
     * Otherwise: false.
     * @param flags 
     * @param strict If strict: all given flags must be true.
     */
    public isTrue(flags: string | string[], strict=false): boolean {

        let result = false;
        if (typeof flags == "string") flags = [flags];

        flags.some(flag => {
            let f = this.get(flag);
            let value = f ? f.toLowerCase() == "true" : false;

            if (strict && !value) {
                result = false;
                return true;
            }
            return (result = value) && !strict;
        })
        
        return result;

    }

    public toString(): string {

        let result = "";
        let sep = this.size > 3 ? "\n" : " ";
        let keys = this.keys();
        let key: string;
        while ((key = keys.next().value) !== undefined) {
            result += `,${sep}'${key}' => '${this.get(key)}'`;
        }
        
        return `[FlagParser] { ${result.substr(2)} }`;
        
    }

    /**
     * Parses an array of args and picks out flags prefixed with either
     * "-" or "--". The parsed flags are then removed from the input
     * array. A FlagParser object is then returned witht he flags
     * alongside their values.
     * @param args The arg `-Syu` will be parsed as the three flags:
     * - S: "true"
     * - y: "true"
     * - u: "true"
     * 
     * The arg `--foo` will be parsed as the flag:
     * - foo: "true"
     * 
     * The arg `--foo="bar baz"` will be parsed as the flag:
     * - foo: "bar baz"
     */
    public static parse(args: string[], unquoteArgs=true, isShellArgs=false): FlagParser {

        let result: FlagParser = new FlagParser();
        let offset = 0;
        
        args.slice(0).forEach((arg, index) => {

            if (arg.substr(0, 2) == "--") {
                let value: string = "";
                let identifier = arg.substring(2);
                let match: RegExpMatchArray | null = null;

                if (!isShellArgs) {
                    match = identifier.match(/((?<=\S\=)(["'`])(?:(?=(\\?))\3.)*?\2)|((?<=\S\=)[^\s]*)/gm);
                }
                else {
                    // shell args are unquoted by default.
                    match = identifier.match(/(?<=\=).*/gm);
                }

                if (match) {
                    value = Utils.unquote(match[0]);
                    identifier = arg.substring(2, arg.indexOf("="));
                }
                else value = "true";
                result.set(identifier, value);

                // remove flag from input array
                args.splice(index - offset, 1);
                offset++;
            }
            else if (arg.substr(0,1) == "-") {
                let flags = arg.split("");
                flags.shift();
                flags.forEach(flag => {
                    result.set(flag, "true");
                })

                args.splice(index - offset, 1);
                offset++;
            }
            else {
                // unquote the arg
                if (unquoteArgs) {
                    args[index - offset] = Utils.unquote(args[index - offset]);
                }
            }
            
        })

        return result;
        
    }
    
}