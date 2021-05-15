import { exec, execSync } from "child_process";
import { promisify } from "util";
import { platform } from "os";
import * as _ from "lodash";
import * as customLocation from "./customLocation";
import * as sudo from "sudo-prompt";
import { promises, constants } from "fs";
import messages from "../messages";
import { vscode } from "./vscodeProxy";
import * as path from "path";

export const isWin32 = platform() === "win32";
const NPM = isWin32 ? "npm.cmd" : "npm";

const NPM_REGISTRY_HOST = _.get(
  process,
  "env.NPM_CFG_REGISTRY",
  "http://registry.npmjs.com/"
);
const SEARCH_QUERY_PREFIX = `${NPM_REGISTRY_HOST}-/v1/search?text=`;
const SEARCH_QUERY_SUFFIX =
  "keywords:yeoman-generator &size=25&ranking=popularity";

const CANCELED = "Action cancelled";
const HAS_ACCESS = "Has Access";

class Command {
  private readonly globalNodeModulesPath;
  private readonly globalPath;
  private readonly CHANGE_OWNER_FOR_GLOBAL;
  private readonly SET_DEFAULT_LOCATION;

  constructor() {
    this.globalNodeModulesPath = _.trim(execSync(`${NPM} root -g`).toString());

    const nmLength = path.join(path.sep, "node_modules").length;
    this.globalPath = this.globalNodeModulesPath.substring(
      0,
      this.globalNodeModulesPath.length - nmLength
    );

    this.CHANGE_OWNER_FOR_GLOBAL = messages.change_owner_for_global(
      this.globalPath
    );
    this.SET_DEFAULT_LOCATION = messages.set_default_location(
      customLocation.DEFAULT_LOCATION
    );
  }

  private getGenLocationParams(): string {
    const customInstallationPath = customLocation.getPath();
    return _.isEmpty(customInstallationPath)
      ? "-g"
      : `--prefix ${customInstallationPath}`;
  }

  public getGlobalNodeModulesPath(): string {
    return this.globalNodeModulesPath;
  }

  public async execCommand(arg: string): Promise<any> {
    return promisify(exec)(arg);
  }

  public getGensQueryURL(query: string, recommended: string): string {
    return encodeURI(
      `${SEARCH_QUERY_PREFIX} ${query} ${recommended} ${SEARCH_QUERY_SUFFIX}`
    );
  }

  public async install(genName: string): Promise<any> {
    const locationParams = this.getGenLocationParams();
    const command = `${NPM} install ${locationParams} ${genName}@latest`;
    return this.execCommand(command);
  }

  public async uninstall(genName: string): Promise<any> {
    const locationParams = this.getGenLocationParams();
    const command = `${NPM} uninstall ${locationParams} ${genName}`;
    return this.execCommand(command);
  }

  private async sudoExec(command: string) {
    return new Promise((resolve, reject) => {
      const name = isWin32 ? undefined : messages.yeoman_ui_title;
      sudo.exec(command, { name }, (err, script) => {
        if (err) {
          reject(err);
        } else {
          resolve(script);
        }
      });
    });
  }

  private async getAccessResult(): Promise<string> {
    // we assume that if custom path set by an user is writable
    if (_.isEmpty(customLocation.getPath())) {
      const isWritable = await this.isPathWritable(this.globalNodeModulesPath);
      if (isWritable) {
        // TODO: if (!isWritable) {
        return vscode.window.showInformationMessage(
          messages.no_write_access(this.globalPath),
          { modal: true },
          this.CHANGE_OWNER_FOR_GLOBAL,
          this.SET_DEFAULT_LOCATION
        );
      }
    }
    // global path/custom path is writable
    return HAS_ACCESS;
  }

  private isPathWritable(path: string): Promise<boolean> {
    return promises
      .access(path, constants.W_OK)
      .then(() => true)
      .catch(() => false);
  }

  private grantAccessForGlobalNodeModulesPath(): Promise<unknown> {
    const changeOwnerCommand = isWin32
      ? `icacls ${this.globalNodeModulesPath} /grant Users:F /Q /C /T`
      : `chown -R $USER ${this.globalNodeModulesPath}`;
    return this.sudoExec(changeOwnerCommand);
  }

  public async checkAccessAndSetGeneratorsPath() {
    const accessResult = await this.getAccessResult();
    if (accessResult === this.CHANGE_OWNER_FOR_GLOBAL) {
      await this.grantAccessForGlobalNodeModulesPath();
    } else if (accessResult === this.SET_DEFAULT_LOCATION) {
      await customLocation.setDefaultPath();
    } else if (accessResult !== HAS_ACCESS) {
      throw new Error(CANCELED);
    }
  }
}

export const NpmCommand = new Command();
