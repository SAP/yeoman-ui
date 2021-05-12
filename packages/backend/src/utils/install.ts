import { isEmpty } from "lodash";
import { promises, constants } from "fs";
import * as sudo from "sudo-prompt";
import { IChildLogger } from "@vscode-logging/logger";
import explorMessages from "../exploreGensMessages";
import { NpmCommand, isWin32 } from "./npm";
import { vscode } from "./vscodeProxy";
import messages from "../messages";
import * as customLocation from "./customLocation";

const SET_DEFAULT_LOCATION = `Set generators install location to ${customLocation.DEFAULT_LOCATION}`;
const CHANGE_OWNER_FOR_GLOBAL = `Change owner ${NpmCommand.getGlobalPath()} to current user (recommended).\n
  Admin access required`;
const CANCELED = "Action cancelled";
const HAS_ACCESS = "Has Access";

const enum choices {
  set_defaul_location,
  change_global_owner,
  cancelled,
}

export class InstallUtil {
  private readonly logger: IChildLogger;
  private readonly globalNpmPath: string;

  constructor(logger: IChildLogger) {
    this.logger = logger;
    this.globalNpmPath = NpmCommand.getGlobalPath();
  }

  private async sudoExec(command: string) {
    const options = {
      name: isWin32 ? undefined : messages.yeoman_ui_title, // options.name is not supported on windows
    };
    return new Promise((resolve, reject) => {
      sudo.exec(command, options, (err, script) => {
        if (err) {
          reject(err);
        } else {
          resolve(script);
        }
      });
    });
  }

  private async getUsersChoice(): Promise<string | undefined> {
    if (isEmpty(customLocation.getPath())) {
      const isWritable = await this.isNpmPathWritable(this.globalNpmPath);
      if (!isWritable) {
        return vscode.window.showInformationMessage(
          `${messages.yeoman_ui_title}\nYou do not have write access to directory "${this.globalNpmPath}".\n
          Choose one of the following:`,
          { modal: true },
          ...[CHANGE_OWNER_FOR_GLOBAL, SET_DEFAULT_LOCATION]
        );
      }
    }
    // global node_modules or custom location are writable
    return HAS_ACCESS;
  }

  private isNpmPathWritable(npmPath: string): Promise<boolean> {
    return promises
      .access(npmPath, constants.W_OK)
      .then(() => true)
      .catch(() => false);
  }

  private showAndLogError(messagePrefix: string, error: any) {
    const errorMessage = error.toString();
    this.logger.error(errorMessage);
    vscode.window.showErrorMessage(`${messagePrefix}: ${errorMessage}`);
  }

  public async installGenerator(genName: string) {
    const installingMessage = explorMessages.installing(genName);
    const statusbarMessage = vscode.window.setStatusBarMessage(
      installingMessage
    );

    try {
      const userChoice = await this.getUsersChoice();
      if (userChoice === CHANGE_OWNER_FOR_GLOBAL) {
        const changeOwnerCommand = isWin32
          ? `icacls ${this.globalNpmPath} /grant Users:F /Q /C /T`
          : `chown -R $USER ${this.globalNpmPath}`;
        await this.sudoExec(changeOwnerCommand);
      } else if (userChoice === SET_DEFAULT_LOCATION) {
        await customLocation.setDefaultPath();
      } else if (userChoice === CANCELED) {
        return Promise.reject(CANCELED);
      }

      vscode.window.showInformationMessage(
        `Please wait while generator installing. Check progress in status bar`
      );
      await NpmCommand.install(genName);
      const successMessage = explorMessages.installed(genName);
      vscode.window.showInformationMessage(successMessage);
      return true;
    } catch (error) {
      this.showAndLogError(explorMessages.failed_to_install(genName), error);
      return false;
    } finally {
      statusbarMessage.dispose();
    }
  }
}
