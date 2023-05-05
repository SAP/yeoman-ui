export abstract class AppWizard {
  abstract showProgress(message?: string): void;
  abstract showWarning(message: string, type: MessageType): void;
  abstract showError(message: string, type: MessageType): void;
  abstract showInformation(message: string, type: MessageType): void;
  abstract setHeaderTitle(title: string, additionalInfo?: string): void;

  public static create(genOptions: any = {}): AppWizard {
    class EmptyAppWizard extends AppWizard {
      showProgress(): void {}
      showWarning(): void {}
      showError(): void {}
      showInformation(): void {}
      setHeaderTitle(): void {}
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

/**
 * Enhanced validation messages to support embedded help urls and commands
 */
export interface IValidationLink {
  /**
   * Validation message to be shown to the end user
   */
  message: string;
  link: {
    /**
     * The text associated with the help link
     */
    text: string;
    /**
     * A string base64 encoded image
     */
    icon?: string;
    /**
     * Command to be exectuted and parameters passed to the command
     */
    command?: {
      id: string;
      params: Object | string;
    };
    /**
     * A http url string
     */
    url?: string;
  };
  /**
   * Provide a stringified version of the link that will be used on the CLI
   */
  toString(): string;
}

/**
 * Messages with severity
 */
export interface IMessageSeverity {
  message: string;
  severity: Severity;
}
