
export type ScoreboardMap = Map<string, ScoreboardItem>;

export class ScoreboardItem {
    id: string;
    name: string;
    rank: number = -1;
    fields: {
        [key: string]: {
            value: number,
            unit?: string
        }
    };
    constructor(id: string, name: string, fields: { [key: string]: { value: number, unit?: string } }) {
        this.id = id;
        this.name = name;
        this.fields = fields;
    }
}

export enum RankStrategy {
    ASCENDING,
    DESCENDING
}

export class Scoreboard {

    private items: ScoreboardMap;

    constructor() {
        this.items = new Map();
    }

    public addItem(item: ScoreboardItem): ScoreboardMap {

        this.items.set(item.id, item);
        return this.items;
        
    }

    public getItems(): ScoreboardMap {
        return this.items;
    }

    public getItemArray(): ScoreboardItem[] {
        return Array.from(this.items.values());
    }

    public rank(field: string, strategy=RankStrategy.DESCENDING): ScoreboardItem[] {

        let result: ScoreboardItem[] = this.getItemArray();

        let comparator = (a: ScoreboardItem, b: ScoreboardItem) => { return 0 }
        switch (strategy) {
            case RankStrategy.ASCENDING:
                comparator = (a: ScoreboardItem, b: ScoreboardItem) => {
                    if (a.fields[field].value < b.fields[field].value) return -1;
                    if (a.fields[field].value > b.fields[field].value) return 1;
                    return 0;
                }
                break;
            case RankStrategy.DESCENDING:
                comparator = (a: ScoreboardItem, b: ScoreboardItem) => {
                    if (a.fields[field].value < b.fields[field].value) return 1;
                    if (a.fields[field].value > b.fields[field].value) return -1;
                    return 0;
                }
                break;
        }

        result = result.sort(comparator);
        let currentRank = 1;
        let lastValue: number | null = null;
        result.forEach(item => {

            let currentValue = item.fields[field].value;
            if (lastValue != null && lastValue != currentValue) {
                currentRank++;
            }
            lastValue = currentValue;

            item.rank = currentRank;
            
        });
        
        return result;
        
    }
    
}