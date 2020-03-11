export class Prompts {
    private callback: any;

    constructor(private items: IPrompt[] = []) { }

    public splice(start: number, deleteCount: number, items: IPrompt[]) {
        if (items) {
            items = Array.isArray(items) ? items : [items];
            this.items.splice(start, deleteCount, ...items);
        } else {
            this.items.splice(start, deleteCount);
        }
        if (this.callback) {
            this.callback(this.items);
        }
    }

    public setCallback(callback: any) {
        this.callback = callback;
        callback(this.items);
    }

    public size() {
        return this.items.length;
    }
}

export interface IPrompt {
    name: string;
    description: string;
}