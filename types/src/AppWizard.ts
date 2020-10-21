export class AppWizard {
	public messages: AppWizard.Messages;

	constructor(messages: AppWizard.Messages) {
		this.messages = messages;
	}

	public static create(genOptions?: any): AppWizard {
		if (genOptions.appWizard && (genOptions.appWizard instanceof AppWizard)) {
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







