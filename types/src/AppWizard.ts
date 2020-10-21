export class AppWizard {
	public messages: AppWizard.Messages;

	constructor(messages: AppWizard.Messages) {
		this.messages = messages;
	}

	public static create(genOptions?: any): AppWizard {
		if (genOptions.appWizard) {
			return genOptions.appWizard;
		}

		class EmptyMessages extends AppWizard.Messages {
			showProgress(message?: string): void { }
			show(message: Message): void { }
		}
		return new AppWizard(new EmptyMessages());
	}
}

export namespace AppWizard {
	export abstract class Messages {
		abstract showProgress(message?: string): void;
		abstract show(message: Message): void;
	}
}

export class Message {
	constructor(
		public text: string,
		public type = Message.Type.info,
		public location = Message.Location.notification,
	) { }
}

export namespace Message {
	export enum Location {
		prompt,
		notification
	}

	export enum Type {
		error, warn, info
	}
}

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







