import { exec } from "child_process";
import { promisify } from "util";
import { platform } from "os";
import * as _ from "lodash";
import * as customLocation from "./customLocation";
import * as sudo from "sudo-prompt";
import * as fs from "fs";
import messages from "../messages";
import { vscode } from "./vscodeProxy";
import * as path from "path";
import * as npmFetch from "npm-registry-fetch";
import { LookupGeneratorMeta } from "yeoman-environment";
import { getConsoleWarnLogger } from "../logger/console-logger";
import { Constants } from "./constants";

const promisifiedExec = promisify(exec);

type ExecResult = {
  stderr: string;
  stdout: string;
};

export type PackagesData = {
  packages: any[];
  total: number;
};

export const isWin32 = platform() === "win32";
const NPM = isWin32 ? "npm.cmd" : "npm";

const regUrl = new URL(_.get(process, "env.NPM_CFG_REGISTRY", "http://registry.npmjs.com/"));
regUrl.pathname = `-/v1/search`;
const SEARCH_QUERY_PREFIX = `${regUrl.toString()}?text=`;
const SEARCH_QUERY_SUFFIX = "keywords:yeoman-generator &size=25&ranking=popularity";

const CANCELED = "Action cancelled";
const HAS_ACCESS = "Has Access";

class Command {
  private globalNodeModulesPathPromise: Promise<string>;
  private readonly SET_DEFAULT_LOCATION;

  constructor() {
    this.setGlobalNodeModulesPath();
    this.SET_DEFAULT_LOCATION = messages.set_default_location(customLocation.DEFAULT_LOCATION);
  }

  private setGlobalNodeModulesPath() {
    this.globalNodeModulesPathPromise = this.execCommand(`${NPM} root -g`).then((globalNodeModulesPath: string) => {
      return fs.promises.mkdir(globalNodeModulesPath, { recursive: true }).then(() => globalNodeModulesPath);
    });
  }

  private getGenLocationParams(): string {
    const customInstallationPath = customLocation.getPath();
    return _.isEmpty(customInstallationPath) ? "-g" : `--prefix ${customInstallationPath}`;
  }

  private async execCommand(arg: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        void promisifiedExec(arg).then((result: ExecResult) => {
          if (!_.isEmpty(result.stderr)) {
            // no need to throw error, because stderr usually contains warnings
            getConsoleWarnLogger().warn(result.stderr);
          }

          resolve(_.trim(result.stdout));
        });
      }, 1);
    });
  }

  private getGensQueryURL(query: string, recommended: string): string {
    query = query || "";
    recommended = recommended || "";
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
    // we assume that if custom path set by an user it is writable
    if (_.isEmpty(customLocation.getPath())) {
      const globalNodeModulesPath = await this.getGlobalNodeModulesPath();
      const isWritable = await this.isPathWritable(globalNodeModulesPath);
      if (!isWritable) {
        const globalPath = await this.getGlobalPath();
        return vscode.window.showInformationMessage(
          messages.no_write_access(globalPath),
          { modal: true },
          messages.change_owner_for_global(globalPath),
          this.SET_DEFAULT_LOCATION
        );
      }
    }
    // global path/custom path is writable
    return HAS_ACCESS;
  }

  private isPathWritable(path: string): Promise<boolean> {
    return fs.promises
      .access(path, fs.constants.W_OK)
      .then(() => true)
      .catch(() => false);
  }

  private async grantAccessForGlobalNodeModulesPath() {
    const globalNodeModulesPath = await this.getGlobalNodeModulesPath();
    const changeOwnerCommand = isWin32
      ? `icacls ${globalNodeModulesPath} /grant Users:(OI)(CI)F`
      : `chown -R $USER ${globalNodeModulesPath}`;
    const globalPath = await this.getGlobalPath();
    const statusBarMessage = vscode.window.setStatusBarMessage(messages.changing_owner_permissions(globalPath));
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
      const packageJsonString: string = await fs.promises.readFile(packageJsonFilePath, "utf8");
      return JSON.parse(packageJsonString);
    } catch (error) {
      getConsoleWarnLogger().error(`Could not get ${packageJsonFilePath} file content. Reason: ${error}`);
    }
  }

  private async getGlobalPath(): Promise<string> {
    const globalNodeModulesPath = await this.getGlobalNodeModulesPath();
    const globalPathArray = _.split(globalNodeModulesPath, path.join(path.sep, "node_modules"), 1);
    return _.get(globalPathArray, "[0]");
  }

  public getGlobalNodeModulesPath(): Promise<string> {
    return this.globalNodeModulesPathPromise;
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
    if (!Constants.IS_IN_BAS) {
      const accessResult = await this.getAccessResult();
      const globalPath = await this.getGlobalPath();
      if (accessResult === messages.change_owner_for_global(globalPath)) {
        await this.grantAccessForGlobalNodeModulesPath();
      } else if (accessResult === this.SET_DEFAULT_LOCATION) {
        await customLocation.setDefaultPath();
      } else if (accessResult !== HAS_ACCESS) {
        throw new Error(CANCELED);
      }
    }
  }
}

export const NpmCommand = new Command();
