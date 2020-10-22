import * as _ from "lodash";


export class AppWizard {
	public messages: AppWizard.Messages;

	constructor(initData?: any) {
		this.messages = _.get(initData, "messages", new EmptyMessages());
	}

	public static create(genOptions?: any): AppWizard {
		return _.get(genOptions, "appWizard", 
			new AppWizard({messages: new EmptyMessages()}));
	}
}

export namespace AppWizard {
	export abstract class Messages {
		abstract showProgress(message?: string): void;
		abstract showWarning(message: Message): void;
		abstract showError(message: Message): void;
		abstract showInformation(message: Message): void;
	}
}

class EmptyMessages extends AppWizard.Messages {
	showProgress(message?: string): void { }
	showWarning(message: Message): void { }
	showError(message: Message): void { }
	showInformation(message: Message): void { }
}

export class Message {
	constructor(
		public text: string,
		public location = Message.Type.notification,
	) { }
}

export namespace Message {
	export enum Type {
		prompt,
		notification
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
		return _.size(this.items);
	}
}

export interface IPrompt {
	name: string;
	description: string;
}
