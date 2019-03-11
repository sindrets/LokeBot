
export class FlagParser extends Map<string,string> {

    public isTrue(flag: string): boolean {

        let f = this.get(flag);
        return f ? f.toLowerCase() == "true" : false;
        
    }

    public static parseFlags(args: string[]): FlagParser {

        let result: FlagParser = new FlagParser();
        let offset = 0;
        
        args.slice(0).forEach((arg, index) => {

            if (arg.substr(0, 2) == "--") {
                let value: string = "";
                let tmp = arg.match(/\=(["'])(?:(?=(\\?))\2.)*?\1/);
                if (tmp) value = tmp[0].substring(2, tmp[0].length-1);
                else value = "true";
                result.set(arg.substring(2), value);

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