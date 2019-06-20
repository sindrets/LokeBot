
declare module 'ascii-table' {
    export default class AsciiTable {
        static CENTER: number;
        static LEFT: number;
        static RIGHT: number;
        static VERSION: string;
        static align(dir: any, str: any, len: any, pad: any): any;
        static alignAuto(str: any, len: any, pad: any): any;
        static alignCenter(str: any, len: any, pad: any): any;
        static alignLeft(str: any, len: any, pad: any): any;
        static alignRight(str: any, len: any, pad: any): any;
        static arrayFill(len: any, fill: any): any;
        static factory(name: any, options: any): any;
        constructor(name?: any, options?: any);
        options: any;
        addData(data: any, rowCallback: any, asMatrix: any): any;
        addRow(row: any, ...args: any[]): any;
        addRowMatrix(rows: any): any;
        clear(name: any): any;
        clearRows(): any;
        fromJSON(obj: any): any;
        getHeading(): any;
        getRows(): any;
        getTitle(): any;
        parse(obj: any): any;
        removeBorder(): any;
        render(): any;
        reset(name: any): any;
        setAlign(idx: any, dir: any): any;
        setAlignCenter(...args: any[]): any;
        setAlignLeft(...args: any[]): any;
        setAlignRight(...args: any[]): any;
        setBorder(edge: any, fill: any, top: any, bottom: any, ...args: any[]): any;
        setHeading(row: any, ...args: any[]): any;
        setHeadingAlign(dir: any): any;
        setHeadingAlignCenter(...args: any[]): any;
        setHeadingAlignLeft(...args: any[]): any;
        setHeadingAlignRight(...args: any[]): any;
        setJustify(val: any, ...args: any[]): any;
        setTitle(name: any): any;
        setTitleAlign(dir: any): any;
        setTitleAlignCenter(...args: any[]): any;
        setTitleAlignLeft(...args: any[]): any;
        setTitleAlignRight(...args: any[]): any;
        sort(method: any): any;
        sortColumn(idx: any, method: any): any;
        toJSON(): any;
        valueOf(): any;
    }
}
