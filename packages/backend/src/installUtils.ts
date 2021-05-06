import * as _ from "lodash";
import * as fs from "fs";
import { homedir } from "os";
import { join } from "path";

import { IChildLogger } from "@vscode-logging/logger";
import * as util from "util";
import * as cp from "child_process";
import * as envUtils from "./utils/env";
import messages from "./exploreGensMessages";
import * as sudo from "sudo-prompt";

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class InstallUtils {
  private readonly logger: IChildLogger;
  private gensBeingHandled: any[]; // eslint-disable-line @typescript-eslint/prefer-readonly
  private cachedInstalledGeneratorsPromise: Promise<string[]>;
  private vscode: any;
  private readonly npmGlobalPathsPromise: Promise<any>;
  public static readonly NPM = envUtils.isWin32 ? "npm.cmd" : "npm";
  public static readonly GENERATOR = "generator-";

  public static readonly INSTALLATION_LOCATION =
    "ApplicationWizard.installationLocation";
  private async exec(arg: string) {
    return util.promisify(cp.exec)(arg);
  }

  public async sudoExec(command: string) {
    const options = {
      name: "Application Wizard",
    };
    return new Promise((resolve, reject) => {
      sudo.exec(command, options, (err, script) => {
        if (err) reject(err);
        else resolve(script);
      });
    });
  }

  public static getInstallationLocation(wsConfig: any) {
    const location = _.trim(wsConfig.get(this.INSTALLATION_LOCATION));
    return fs.existsSync(location) ? location : undefined;
  }

  public static async setInstallationLocation(wsConfig: any, location: string) {
    // update global settings
    return wsConfig.update(this.INSTALLATION_LOCATION, location, true);
  }
  private getVscode() {
    try {
      this.vscode = require("vscode");
      return this.vscode;
    } catch (error) {
      return undefined;
    }
  }

  public async getGlobalNodeModulesPath() {
    const res: any = await this.npmGlobalPathsPromise;
    return _.trim(res.stdout);
  }
  public async getGeneratorsLocationParams(vscode: any) {
    let location = InstallUtils.getInstallationLocation(
      this.getVscode().workspace.getConfiguration()
    );

    let hasWriteAccess = true;
    let sudo_terminal = false;
    let globalNpmPath: string;
    if (_.isEmpty(location)) {
      globalNpmPath = await this.getGlobalNodeModulesPath();
      hasWriteAccess = await fs.promises
        .access(globalNpmPath, fs.constants.W_OK)
        .then(() => true)
        .catch(() => false);
      if (hasWriteAccess === false) {
        const defaultUserLocation = join(
          homedir(),
          ".application_wizard",
          "generators"
        );
        const C_CUSTOM = `Set Generators install location to ${defaultUserLocation}`;
        const C_SUDO = `Change owner ${globalNpmPath} to current user in the Terminal`;

        const result = await this.vscode.window.showInformationMessage(
          `Application Wizard\nYou do not have write access to directory "${globalNpmPath}". \nChoose one of the following:`,
          { modal: true },
          ...[C_SUDO, C_CUSTOM]
        );
        if (result === C_CUSTOM) {
          location = defaultUserLocation;
          await InstallUtils.setInstallationLocation(
            this.getVscode().workspace.getConfiguration(),
            location
          );
        }
        if (result === C_SUDO) {
          sudo_terminal = true;
        }

        if (result === undefined) {
          throw new Error("Action cancelled");
        }
      }
    } else {
      hasWriteAccess = await fs.promises
        .access(location, fs.constants.W_OK)
        .then(() => true)
        .catch(() => false);
    }

    return {
      location: _.isEmpty(location) ? "-g" : `--prefix ${location}`,
      sudo_terminal,
      globalNpmPath,
    };
  }

  constructor(logger: IChildLogger) {
    this.logger = logger;
    this.gensBeingHandled = [];
    this.npmGlobalPathsPromise = this.exec(`${InstallUtils.NPM} root -g`);
  }

  public static getNpmInstallCommand(locationParams: string, genName: string) {
    return `${this.NPM} install ${locationParams} ${genName}@latest`;
  }
  private getNpmInstallCommand(locationParams: string, genName: string) {
    return InstallUtils.getNpmInstallCommand(locationParams, genName);
  }

  private showAndLogError(messagePrefix: string, error: any) {
    const errorMessage = error.toString();
    this.logger.error(errorMessage);
    this.vscode.window.showErrorMessage(`${messagePrefix}: ${errorMessage}`);
  }

  public async installGenerator(genName: string) {
    // this.addToHandled(genName, GenState.installing);
    const installingMessage = messages.installing(genName);
    const statusbarMessage = this.getVscode().window.setStatusBarMessage(
      installingMessage
    );

    try {
      this.logger.debug(installingMessage);
      // this.updateBeingHandledGenerator(genName, GenState.installing);
      const locationParams = await this.getGeneratorsLocationParams(
        this.vscode
      );

      let installCommand = this.getNpmInstallCommand(
        locationParams.location,
        genName
      );
      let continueWithGeneratorInstall = false;
      // Change ownership
      if (locationParams.sudo_terminal) {
        const changeOwnerCommand = `chown -R $USER ${locationParams.globalNpmPath}`;
        await this.sudoExec(changeOwnerCommand);
        continueWithGeneratorInstall = true;
      } else {
        continueWithGeneratorInstall = true;
      }
      // while (continueWithGeneratorInstall === false) {
      //   await timeout(3000);
      // }

      if (continueWithGeneratorInstall === true) {
        this.vscode.window.showInformationMessage(
          `Please wait while generator installing. Check progress in status bar`
        );
        await this.exec(installCommand);
        const successMessage = messages.installed(genName);
        this.logger.debug(successMessage);
        this.vscode.window.showInformationMessage(successMessage);
      }
    } catch (error) {
      this.showAndLogError(messages.failed_to_install(genName), error);
    } finally {
      statusbarMessage.dispose();
    }
  }
}
