export abstract class AppWizard {
  abstract showProgress(message?: string): void;
  abstract showWarning(message: string, type: MessageType): void;
  abstract showError(message: string, type: MessageType): void;
  abstract showInformation(message: string, type: MessageType): void;

  public static create(genOptions: any = {}): AppWizard {
    class EmptyAppWizard extends AppWizard {
      showProgress(): void {}
      showWarning(): void {}
      showError(): void {}
      showInformation(): void {}
    }

    return genOptions.appWizard ? genOptions.appWizard : new EmptyAppWizard();
  }
}

export enum Severity {
  error,
  warning,
  information,
}

export enum MessageType {
  prompt,
  notification,
}

export class Prompts {
  private callback: any;

  constructor(private readonly items: IPrompt[] = []) {}

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
