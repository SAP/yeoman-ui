import { exec, execSync } from "child_process";
import { promisify } from "util";
import { platform } from "os";
import * as _ from "lodash";
import * as customLocation from "./customLocation";
import * as sudo from "sudo-prompt";
import { readFile, promises, constants, existsSync } from "fs-extra";
import messages from "../messages";
import { vscode } from "./vscodeProxy";
import * as path from "path";
import * as npmFetch from "npm-registry-fetch";
import { LookupGeneratorMeta } from "yeoman-environment";
import { getConsoleWarnLogger } from "../logger/console-logger";

export type PackagesData = {
  packages: any[];
  total: number;
};

export const isWin32 = platform() === "win32";
const NPM = isWin32 ? "npm.cmd" : "npm";

const NPM_REGISTRY_HOST = _.get(process, "env.NPM_CFG_REGISTRY", "http://registry.npmjs.com/");
const SEARCH_QUERY_PREFIX = `${NPM_REGISTRY_HOST}-/v1/search?text=`;
const SEARCH_QUERY_SUFFIX = "keywords:yeoman-generator &size=25&ranking=popularity";

const CANCELED = "Action cancelled";
const HAS_ACCESS = "Has Access";

class Command {
  private readonly globalNodeModulesPath;
  private readonly globalPath;
  private readonly CHANGE_OWNER_FOR_GLOBAL;
  private readonly SET_DEFAULT_LOCATION;
  private isInBAS: boolean;

  constructor() {
    this.globalNodeModulesPath = _.trim(execSync(`${NPM} root -g`).toString());

    const nmLength = path.join(path.sep, "node_modules").length;
    this.globalPath = this.globalNodeModulesPath.substring(0, this.globalNodeModulesPath.length - nmLength);

    this.CHANGE_OWNER_FOR_GLOBAL = messages.change_owner_for_global(this.globalPath);
    this.SET_DEFAULT_LOCATION = messages.set_default_location(customLocation.DEFAULT_LOCATION);

    this.isInBAS = !_.isEmpty(_.get(process, "env.WS_BASE_URL"));
  }

  private getGenLocationParams(): string {
    const customInstallationPath = customLocation.getPath();
    return _.isEmpty(customInstallationPath) ? "-g" : `--prefix ${customInstallationPath}`;
  }

  private async execCommand(arg: string): Promise<any> {
    return promisify(exec)(arg);
  }

  private getGensQueryURL(query: string, recommended: string): string {
    return encodeURI(`${SEARCH_QUERY_PREFIX} ${query} ${recommended} ${SEARCH_QUERY_SUFFIX}`);
  }

  private getSingleGenQueryURL(query: string): string {
    return encodeURI(`${SEARCH_QUERY_PREFIX} ${query} keywords:yeoman-generator &size=1`);
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
      const globalNodeModulesPathExists = existsSync(this.globalNodeModulesPath);
      if (!globalNodeModulesPathExists) {
        return Promise.reject(`${this.globalNodeModulesPath} does not exist`);
      }
      const isWritable = await this.isPathWritable(this.globalNodeModulesPath);
      if (!isWritable) {
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

  private async grantAccessForGlobalNodeModulesPath() {
    const changeOwnerCommand = isWin32
      ? `icacls ${this.globalNodeModulesPath} /grant Users:(OI)(CI)F`
      : `chown -R $USER ${this.globalNodeModulesPath}`;
    const statusBarMessage = vscode.window.setStatusBarMessage(messages.changing_owner_permissions(this.globalPath));
    try {
      await this.sudoExec(changeOwnerCommand);
    } finally {
      statusBarMessage.dispose();
    }
  }

  private async shouldBeUpdated(packageJson: any): Promise<boolean> {
    const queryUrl = this.getSingleGenQueryURL(packageJson.name);
    const npmJsModules = await npmFetch.json(queryUrl);
    const npmJsModule: any = _.get(npmJsModules, "objects.[0]");
    return npmJsModule ? npmJsModule.package.version !== packageJson.version : false;
  }

  private async getPackageJson(packagePath: string): Promise<any | undefined> {
    const packageJsonFilePath = path.join(packagePath, "package.json");
    try {
      const packageJsonString: string = await readFile(packageJsonFilePath, "utf8");
      return JSON.parse(packageJsonString);
    } catch (error) {
      getConsoleWarnLogger().error(`Could not get ${packageJsonFilePath} file content. Reason: ${error}`);
    }
  }

  public getGlobalNodeModulesPath(): string {
    return this.globalNodeModulesPath;
  }

  public async getPackagesData(query = "", author = ""): Promise<PackagesData> {
    const gensQueryUrl = NpmCommand.getGensQueryURL(query, author);
    const queryResult: any = await npmFetch.json(gensQueryUrl);
    return { packages: _.get(queryResult, "objects", []), total: queryResult.total };
  }

  public async getPackageJsons(gensMeta: LookupGeneratorMeta[]): Promise<any[]> {
    const packageJsonPromises: any[] = gensMeta.map((genMeta) => this.getPackageJson(genMeta.packagePath));
    return await Promise.all(packageJsonPromises);
  }

  public async getPackageNamesWithOutdatedVersion(gensMeta: LookupGeneratorMeta[]): Promise<string[]> {
    const packageJsons: any[] = await this.getPackageJsons(gensMeta);

    const packageNameToUpdatePromises = packageJsons.map((packageJson) => {
      return NpmCommand.shouldBeUpdated(packageJson).then((toUpdate) => (toUpdate ? packageJson.name : undefined));
    });

    return _.compact(await Promise.all(packageNameToUpdatePromises));
  }

  public async install(packageName: string): Promise<any> {
    const locationParams = this.getGenLocationParams();
    const command = `${NPM} install ${locationParams} ${packageName}@latest`;
    return this.execCommand(command);
  }

  public async uninstall(packageName: string): Promise<any> {
    const locationParams = this.getGenLocationParams();
    const command = `${NPM} uninstall ${locationParams} ${packageName}`;
    return this.execCommand(command);
  }

  public async checkAccessAndSetGeneratorsPath() {
    if (!this.isInBAS) {
      const accessResult = await this.getAccessResult();
      if (accessResult === this.CHANGE_OWNER_FOR_GLOBAL) {
        await this.grantAccessForGlobalNodeModulesPath();
      } else if (accessResult === this.SET_DEFAULT_LOCATION) {
        await customLocation.setDefaultPath();
      } else if (accessResult !== HAS_ACCESS) {
        throw new Error(CANCELED); //TODO: who catches this error
      }
    }
  }
}

export const NpmCommand = new Command();
