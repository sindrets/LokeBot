import { Utils } from "Utils";

export class FlagParser extends Map<string,string> {

    /**
     * Retrieves the value of the given flag and returns true if the
     * value is equal to the string "true" (case-insensitive).
     * Otherwise: false.
     * @param flag 
     */
    public isTrue(flag: string): boolean {

        let f = this.get(flag);
        return f ? f.toLowerCase() == "true" : false;
        
    }

    public toString(): string {

        let result = "";
        let sep = this.size > 3 ? "\n" : " ";
        let keys = this.keys();
        let key: string;
        while ((key = keys.next().value) !== undefined) {
            result += `,${sep}'${key}' => '${this.get(key)}'`;
        }
        
        return `[Map] { ${result.substr(2)} }`;
        
    }

    /**
     * Parses an array of args and picks out flags prefixed with either
     * "-" or "--". The parsed flags are then removed from the input
     * array. 
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
    public static parseFlags(args: string[]): FlagParser {

        let result: FlagParser = new FlagParser();
        let offset = 0;
        
        args.slice(0).forEach((arg, index) => {

            if (arg.substr(0, 2) == "--") {
                let value: string = "";
                let identifier = arg.substring(2);
                let match = identifier.match(/((\=(["'])(?:(?=(\\?))\4.)*?\3)|(\=[^\s]*))/gm);
                if (match) {
                    value = Utils.unquote(match[0].substr(1, match[0].length-1));
                    identifier = arg.substring(2, arg.indexOf("="));
                }
                else value = "true";
                result.set(identifier, value);

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
            
        })

        return result;
        
    }
    
}