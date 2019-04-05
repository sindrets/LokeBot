export = index;
declare interface CursorPos {
    row: number,
    col: number
}
declare const index: {
    public sync(): CursorPos | undefined;
    public async(callback: (pos: CursorPos | undefined) => void): void;
}
