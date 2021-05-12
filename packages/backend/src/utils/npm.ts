import { exec, execSync } from "child_process";
import { promisify } from "util";
import { platform } from "os";
import * as _ from "lodash";
import * as customLocation from "./customLocation";

export const isWin32 = platform() === "win32";
const NPM = isWin32 ? "npm.cmd" : "npm";

const NPM_REGISTRY_HOST = _.get(process, "env.NPM_CFG_REGISTRY", "http://registry.npmjs.com/");
const SEARCH_QUERY_PREFIX = `${NPM_REGISTRY_HOST}-/v1/search?text=`;
const SEARCH_QUERY_SUFFIX = "keywords:yeoman-generator &size=25&ranking=popularity";

class Command {
  private readonly npmGlobalPath;

  constructor() {
    this.npmGlobalPath = execSync(`${NPM} root -g`);
  }

  private getGenLocationParams(): string {
    const customInstallationPath = customLocation.getPath();
    return _.isEmpty(customInstallationPath) ? "-g" : `--prefix ${customInstallationPath}`;
  }

  public getGlobalPath(): string {
    return this.getGlobalNodeModulesPath().replace("node_modules", "");
  }

  public getGlobalNodeModulesPath(): string {
    return _.trim(this.npmGlobalPath.toString());
  }

  public async execCommand(arg: string): Promise<any> {
    return promisify(exec)(arg);
  }

  public getGensQueryURL(query: string, recommended: string): string {
    return encodeURI(`${SEARCH_QUERY_PREFIX} ${query} ${recommended} ${SEARCH_QUERY_SUFFIX}`);
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
}

export const NpmCommand = new Command();
