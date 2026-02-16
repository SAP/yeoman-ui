export abstract class AppWizard {
  abstract showProgress(message?: string): void;
  abstract showWarning(message: string, type: MessageType): void;
  abstract showError(message: string, type: MessageType): void;
  abstract showInformation(message: string, type: MessageType): void;
  abstract setHeaderTitle(title: string, additionalInfo?: string): void;
  abstract setBanner(bannerProps: IBannerProps): void;

  public static create(genOptions: any = {}): AppWizard {
    class EmptyAppWizard extends AppWizard {
      showProgress(): void {}
      showWarning(): void {}
      showError(): void {}
      showInformation(): void {}
      setHeaderTitle(): void {}
      setBanner(): void {}
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
 * Action where 'text' is present and links to a VS Code command.
 */
interface IActionWithTextAndCommand {
  /**
   * The display text for the action.
   * Clicking this text triggers the associated VS Code command.
   */
  text: string;

  /**
   * Command to be executed and parameters passed to the command
   */
  command: {
    id: string;
    params?: Object | string;
  };

  /**
   * A URL string.
   * This should not be present when 'command' is defined.
   */
  url?: never;
}

/**
 * Action where 'text' is present and links to a URL.
 */
interface IActionWithTextAndUrl {
  /**
   * The display text for the action.
   * Clicking this text triggers the associated VS Code command.
   */
  text: string;

  /**
   * Command to be executed and parameters passed to the command
   */
  command?: never;

  /**
   * A URL string.
   */
  url: string;
}

export type IAction = IActionWithTextAndUrl | IActionWithTextAndCommand;

export interface IBannerProps {
  /**
   * The main text to display in the banner
   */
  text: string;
  /**
   * Accessibility label for the banner
   */
  ariaLabel: string;
  /**
   * Determines the step during which the banner should be displayed.
   * If not provided, the banner will not be tied to a specific step and may appear globally.
   */
  displayBannerForStep?: string;
  /**
   * Icon metadata, including the icon source and type
   */
  icon?: {
    /**
     * The actual icon data (e.g., Base64 string for images or icon name for Material Design icons)
     */
    source: string;
    /**
     * Specifies the type of the icon (e.g., "image" for Base64 images or "mdi" for Material Design icons)
     */
    type: "image" | "mdi";
  };
  /**
   * Action to be triggered (common for both banner click and link click)
   */
  action: IAction;
  /**
   * Determines where the action should be triggered
   * - `banner`: Action is triggered on banner click
   * - `link`: Action is triggered on link click
   */
  triggerActionFrom: "banner" | "link";
  /**
   * Optional flag to enable animated on the banner
   */
  animated?: boolean;
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
