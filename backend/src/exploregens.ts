import * as npmFetch from "npm-registry-fetch";
import * as _ from "lodash";
import * as cp from "child_process";
import { IChildLogger } from "@vscode-logging/logger";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import * as util from "util";
import * as path from "path";
import messages from "./exploreGensMessages";
import Environment = require("yeoman-environment");


export class ExploreGens {
    public static getInstallationLocation(wsConfig: any) {
        return _.trim(wsConfig.get(ExploreGens.INSTALLATION_LOCATION));
    }
    
    private static readonly INSTALLATION_LOCATION = "Explore Generators.installationLocation";

    private logger: IChildLogger;
    private rpc: IRpc;
    private gensBeingHandled: string[];
    private cachedInstalledGeneratorsPromise: Promise<string[]>;
    private context: any;
    private vscode: any;

    private readonly LAST_AUTO_UPDATE_DATE = "Explore Generators.lastAutoUpdateDate";
    private readonly SEARCH_QUERY = "Explore Generators.searchQuery";
    private readonly AUTO_UPDATE = "Explore Generators.autoUpdate"
    private readonly NPM = (process.platform === "win32" ? "npm.cmd" : "npm");
    private readonly EMPTY = "";
    private readonly NODE_MODULES = "node_modules";
    private readonly ONE_DAY = 1000 * 60 * 60 * 24;
    private readonly SEARCH_QUERY_PREFIX = "http://registry.npmjs.com/-/v1/search?text=";
    private readonly SEARCH_QUERY_SUFFIX = "keywords:yeoman-generator &size=25&ranking=popularity";

    constructor(rpc: IRpc, logger: IChildLogger, context?: any, vscode?: any) {
        this.context = context;
        this.vscode = vscode;
        this.logger = logger;
        this.gensBeingHandled = [];
        this.init(rpc);
        this.doGeneratorsUpdate();
    }

    private init(rpc: IRpc) {
        this.initRpc(rpc);
        this.setInstalledGens();
    }

    private async getInstalledGens() {
        return this.cachedInstalledGeneratorsPromise;
    }

    private setInstalledGens() {
        this.cachedInstalledGeneratorsPromise = this.getAllInstalledGenerators();
    }

    private doGeneratorsUpdate() {
        const lastUpdateDate = this.context.globalState.get(this.LAST_AUTO_UPDATE_DATE, 0);
        const currentDate = Date.now();
        if ((currentDate - lastUpdateDate) > this.ONE_DAY) {
            this.context.globalState.update(this.LAST_AUTO_UPDATE_DATE, currentDate);
            this.updateAllInstalledGenerators();
        }
    }

    private async getAllInstalledGenerators(): Promise<string[]> {
        return new Promise(resolve => {
            const yoEnv: Environment.Options = Environment.createEnv();
            const npmPaths = this.getNpmPaths(yoEnv);
            yoEnv.lookup({ npmPaths }, async () => this.onEnvLookup(yoEnv, resolve));
        });
    }

    private initRpc(rpc: IRpc) {
        this.rpc = rpc;
        this.rpc.registerMethod({ func: this.getFilteredGenerators, thisArg: this });
        this.rpc.registerMethod({ func: this.install, thisArg: this });
        this.rpc.registerMethod({ func: this.uninstall, thisArg: this });
        this.rpc.registerMethod({ func: this.isInstalled, thisArg: this });
        this.rpc.registerMethod({ func: this.getRecommendedQuery, thisArg: this });
    }

    private async updateAllInstalledGenerators() {
        const autoUpdateEnabled = this.getWsConfig().get(this.AUTO_UPDATE, true);
        if (autoUpdateEnabled) {
            const installedGenerators: string[] = await this.getAllInstalledGenerators();
            if (!_.isEmpty(installedGenerators)) {
                this.logger.debug(messages.auto_update_started);
                const statusBarMessage = this.vscode.window.setStatusBarMessage(messages.auto_update_started);
                const locationParams = this.getGeneratorsLocationParams();
                const promises = _.map(installedGenerators, genName => {
                    return this.installGenerator(locationParams, genName, false);
                });

                await Promise.all(promises);
                statusBarMessage.dispose();
                this.vscode.window.setStatusBarMessage(messages.auto_update_finished, 10000);
            }
        }
    }

    private getWsConfig() {
        return this.vscode.workspace.getConfiguration();
    }

    private async install(gen: any) {
        const locationParams = this.getGeneratorsLocationParams();
        const res = await this.installGenerator(locationParams, gen.package.name);
        this.setInstalledGens();
        return res;
    }

    private async uninstall(gen: any) {
        const locationParams = this.getGeneratorsLocationParams();
        const res = await this.uninstallGenerator(locationParams, gen.package.name);
        this.setInstalledGens();
        return !res;
    }

    private async getFilteredGenerators(query = this.EMPTY, author = this.EMPTY) {
        query = query || this.EMPTY;
        const gensQueryUrl = this.getGensQueryURL(query, author);

        try {
            const cachedGens = await this.getInstalledGens();
            const res: any = await npmFetch.json(gensQueryUrl);
            const filteredGenerators = _.map(_.get(res, "objects"), gen => {
                const genName = gen.package.name;
                gen.disabledToHandle = _.includes(this.gensBeingHandled, genName) ? true : false;
                gen.installed = _.includes(cachedGens, genName);
                return gen;
            });

            return [filteredGenerators, res.total];
        } catch (error) {
            this.showAndLogError(messages.failed_to_get(gensQueryUrl), error);
        }
    }

    private showAndLogError(messagePrefix: string, error: any) {
        const errorMessage = error.toString();
        this.logger.error(errorMessage);
        this.vscode.window.showErrorMessage(`${messagePrefix}: ${errorMessage}`);
    }

    private getGensQueryURL(query: string, recommended: string) {
        return encodeURI(`${this.SEARCH_QUERY_PREFIX} ${query} ${recommended} ${this.SEARCH_QUERY_SUFFIX}`);
    }

    private getRecommendedQuery() {
        const recommended: string[] = this.getWsConfig().get(this.SEARCH_QUERY) || [];
        return _.uniq(recommended);
    }

    private getGeneratorsLocationParams() {
        const location = ExploreGens.getInstallationLocation(this.getWsConfig());
        return _.isEmpty(location) ? "-g" : `--prefix ${location}`;
    }

    private async exec(arg: string) {
        return util.promisify(cp.exec)(arg);
    }

    private async installGenerator(locationParams: string, genName: string, isInstall = true): Promise<boolean> {
        this.gensBeingHandled.push(genName);
        const installingMessage = messages.installing(genName);
        let statusbarMessage;
        if (isInstall) {
            statusbarMessage = this.vscode.window.setStatusBarMessage(installingMessage);
        }

        try {
            this.logger.debug(installingMessage);
            const installCommand = this.getNpmInstallCommand(locationParams, genName);
            this.updateBeingHandledGenerator(genName, true);
            await this.exec(installCommand);
            const successMessage = messages.installed(genName);
            this.logger.debug(successMessage);
            if (isInstall) {
                this.vscode.window.showInformationMessage(successMessage);
            }
            return true;
        } catch (error) {
            this.showAndLogError(messages.failed_to_install(genName), error);
            return false;
        } finally {
            this.removeFromArray(this.gensBeingHandled, genName);
            this.updateBeingHandledGenerator(genName, false);
            if (statusbarMessage) {
                statusbarMessage.dispose();
            }
        }
    }

    private async uninstallGenerator(locationParams: string, genName: string): Promise<boolean> {
        this.gensBeingHandled.push(genName);
        const uninstallingMessage = messages.uninstalling(genName);
        const statusbarMessage = this.vscode.window.setStatusBarMessage(uninstallingMessage);

        try {
            this.logger.debug(uninstallingMessage);
            const uninstallCommand = this.getNpmUninstallCommand(locationParams, genName);
            await this.exec(uninstallCommand);
            const successMessage = messages.uninstalled(genName);
            this.logger.debug(successMessage);
            this.vscode.window.showInformationMessage(successMessage);
            return true;
        } catch (error) {
            this.showAndLogError(messages.failed_to_uninstall(genName), error);
            return false;
        } finally {
            this.removeFromArray(this.gensBeingHandled, genName);
            statusbarMessage.dispose();
        }
    }

    private async isInstalled(gen: any) {
        const installedGens: string[] = await this.getInstalledGens();
        return _.includes(installedGens, gen.package.name);
    }

    private removeFromArray(array: string[], valueToRemove: string) {
        _.remove(array, value => {
            return value === valueToRemove;
        });
    }

    private updateBeingHandledGenerator(genName: string, isBeingHandled: boolean) {
        this.rpc.invoke("updateBeingHandledGenerator", [genName, isBeingHandled]);
    }

    private getNpmInstallCommand(locationParams: string, genName: string) {
        return `${this.NPM} install ${locationParams} ${genName}@latest`;
    }

    private getNpmUninstallCommand(locationParams: string, genName: string) {
        return `${this.NPM} uninstall ${locationParams} ${genName}`;
    }

    private getNpmPaths(env: Environment.Options) {
        const customLocation = ExploreGens.getInstallationLocation(this.getWsConfig());
        if (_.isEmpty(customLocation)) {
            return env.getNpmPaths();
        }
        
        return [path.join(customLocation, this.NODE_MODULES)];
    }

    private onEnvLookup(env: Environment.Options, resolve: any) {
        const gensMeta: string[] = env.getGeneratorsMeta();
        const gensFullNames = _.map(gensMeta, (genMeta: any) => {
            const packagePath = genMeta.packagePath;
            const nodeModulesIndex = packagePath.indexOf(this.NODE_MODULES);
            return packagePath.substring(nodeModulesIndex + this.NODE_MODULES.length + 1);
        })
        resolve(_.uniq(gensFullNames));
      }
}
