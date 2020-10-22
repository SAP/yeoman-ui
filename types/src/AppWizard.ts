import * as _ from "lodash";

export abstract class AppWizard {
	abstract showProgress(message?: string): void;
	abstract showWarning(message: string, type: MessageType): void;
	abstract showError(message: string, type: MessageType): void;
	abstract showInformation(message: string, type: MessageType): void;

	public static create(genOptions?: any): AppWizard {
		return _.get(genOptions, "appWizard", new EmptyAppWizard());
	}
}

class EmptyAppWizard extends AppWizard {
	showProgress(message?: string): void { }
	showWarning(message: string, type: MessageType): void { }
	showError(message: string, type: MessageType): void { }
	showInformation(message: string, type: MessageType): void { }
}

export enum MessageType {
	prompt,
	notification
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
