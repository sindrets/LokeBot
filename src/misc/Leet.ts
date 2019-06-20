/**
 * Adapted from: https://github.com/alexdevero/leet-speak-converter/blob/master/src/leet-converter.js
 */

type GlyphAtlas = [RegExp, string][];
interface GlyphMap {
    [key: string]: string;
}

export class Leet {

    public static encode(text: string, complex = false): string {

        for (let i = 0; i < text.length; i++) {
            let glyph;
            let char = text[i].toLowerCase();

            if (complex) {
                glyph = this.glyphsBasic[char] ? this.glyphsBasic[char] : this.glyphsComplex[char];
            }
            else {
                glyph = this.glyphsBasic[char];
            }

            if (glyph) {
                text = text.replace(text[i], glyph)
            }
        }

        return text;

    }

    public static decode(text: string): string {

        text = text.toLowerCase()

        this.glyphAtlas.map((x) => {
            text = text.replace(x[0], x[1])
        })

        return text;

    }

    private static readonly glyphsBasic: GlyphMap = {
        'a': '4',
        'b': '8',
        'e': '3',
        'f': 'ph',
        'g': '6', // or 9
        'i': '1', // or |
        'o': '0',
        's': '5',
        't': '7' // or +
    };

    private static readonly glyphsComplex: GlyphMap = {
        'c': '(', // or k or |< or /<
        'd': '<|',
        'h': '|-|',
        'k': '|<', // or /<
        'l': '|', // or 1
        'm': '|\\/|',
        'n': '|\\|',
        'p': '|2',
        'u': '|_|',
        'v': '/', // or \/
        'w': '//', // or \/\/
        'x': '><',
        'y': '\'/'
    };

    private static readonly glyphAtlas: GlyphAtlas = [
        [/(\|\\\/\|)/g, 'm'],
        [/(\|\\\|)/g, 'n'],
        [/(\()/g, 'c'],
        [/(<\|)/g, 'd'],
        [/\|-\|/g, 'h'],
        [/(\|<)/g, 'k'],
        [/(\|2)/g, 'p'],
        [/(\|_\|)/g, 'u'],
        [/(\/\/)/g, 'w'],
        [/(><)/g, 'x'],
        [/(\|)/g, 'l'],
        [/(\'\/)/g, 'y'],
        [/(\/)/g, 'v'],
        [/(1)/g, 'i'],
        [/(0)/g, 'o'],
        [/(3)/g, 'e'],
        [/(4)/g, 'a'],
        [/(5)/g, 's'],
        [/(6)/g, 'g'],
        [/(7)/g, 't'],
        [/(8)/g, 'b'],
        [/(ph)/g, 'f'],
    ];

}