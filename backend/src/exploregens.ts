import * as npmFetch from "npm-registry-fetch";
import * as _ from "lodash";
import * as cp from "child_process";
import { IChildLogger } from "@vscode-logging/logger";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import * as util from "util";
import * as path from "path";
import messages from "./exploreGensMessages";
import * as vscode from "vscode";
import Environment = require("yeoman-environment");

export class ExploreGens {
    private logger: IChildLogger;
    private rpc: IRpc;
    private gensBeingHandled: string[];
    private cachedInstalledGeneratorsPromise: Promise<string[]>;

    private readonly LAST_AUTO_UPDATE_DATE = "Explore Generators.lastAutoUpdateDate";
    private readonly INSTALLATION_LOCATION = "Explore Generators.installationLocation";
    private readonly SEARCH_QUERY = "Explore Generators.searchQuery";
    private readonly AUTO_UPDATE = "Explore Generators.autoUpdate"
    private readonly NPM = (process.platform === "win32" ? "npm.cmd" : "npm");
    private readonly EMPTY = "";
    private readonly NODE_MODULES = "node_modules";
    private readonly ONE_DAY = 1000 * 60 * 60 * 24;

    constructor(context: any, logger: IChildLogger) {
        this.logger = logger;
        this.gensBeingHandled = [];

        this.doGeneratorsUpdate(context);
    }

    public init(rpc: IRpc) {
        this.initRpc(rpc);
        this.cachedInstalledGeneratorsPromise = this.getAllInstalledGenerators();
    }

    private doGeneratorsUpdate(context: any) {
        const lastUpdateDate = context.globalState.get(this.LAST_AUTO_UPDATE_DATE, 0);
        const currentDate = Date.now();
        if ((currentDate - lastUpdateDate) > this.ONE_DAY) {
            context.globalState.update(this.LAST_AUTO_UPDATE_DATE, currentDate);
            this.updateAllInstalledGenerators();
        }
    }

    private async getAllInstalledGenerators(): Promise<string[]> {
        const promise: Promise<any> = new Promise(resolve => {
            const env: Environment.Options = Environment.createEnv();
            const npmPaths = this.getNpmPaths(env);
            env.lookup({ npmPaths }, async () => this.onEnvLookup(env, resolve));
        });

        return promise;
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
                const statusBarMessage = vscode.window.setStatusBarMessage(messages.auto_update_started);
                const locationParams = this.getGeneratorsLocationParams();
                const promises = _.map(installedGenerators, genName => {
                    return this.installGenerator(locationParams, genName, false);
                });

                await Promise.all(promises);
                statusBarMessage.dispose();
                vscode.window.setStatusBarMessage(messages.auto_update_finished, 10000);
            }
        }
    }

    private getWsConfig() {
        return vscode.workspace.getConfiguration();
    }

    private async install(gen: any) {
        const genName: string = gen.package.name;
        const locationParams = this.getGeneratorsLocationParams();
        await this.installGenerator(locationParams, genName);
        const installedGens: string[] = await this.cachedInstalledGeneratorsPromise;
        installedGens.push(genName);
        this.cachedInstalledGeneratorsPromise = Promise.resolve(_.uniq(installedGens));
    }

    private async uninstall(gen: any) {
        const genName = gen.package.name;
        const locationParams = this.getGeneratorsLocationParams();
        await this.uninstallGenerator(locationParams, genName);
        const installedGens: string[] = await this.cachedInstalledGeneratorsPromise;
        this.removeFromArray(installedGens, genName);
        this.cachedInstalledGeneratorsPromise = Promise.resolve(installedGens);
    }

    private async getFilteredGenerators(query = this.EMPTY, author = this.EMPTY) {
        const gensQueryUrl = this.getGensQueryURL(query, author);

        try {
            const res: any = await npmFetch.json(gensQueryUrl);
            let filteredGenerators = _.map(_.get(res, "objects"), gen => {
                gen.disabledToHandle = _.includes(this.gensBeingHandled, gen.package.name) ? true : false;
                return gen;
            });

            const cachedGens = await this.cachedInstalledGeneratorsPromise;
            filteredGenerators = _.map(filteredGenerators, filteredGen => {
                filteredGen.action = (_.includes(cachedGens, filteredGen.package.name)) ? "Uninstall" : "Install";
                return filteredGen;
            });
            return [filteredGenerators, res.total];
        } catch (error) {
            this.showAndLogError(messages.failed_to_get(gensQueryUrl), error);
        }
    }

    private showAndLogError(messagePrefix: string, error: any) {
        const errorMessage = error.toString();
        this.logger.error(errorMessage);
        vscode.window.showErrorMessage(`${messagePrefix}: ${errorMessage}`);
    }

    private getGensQueryURL(query: string, recommended: string) {
        const api_endpoint = "http://registry.npmjs.com/-/v1/search?text=";
        const actualQuery = encodeURI(`${query} ${recommended}`);
        return `${api_endpoint}${actualQuery}%20keywords:yeoman-generator%20&size=25&ranking=popularity`;
    }

    private getRecommendedQuery() {
        const recommended: string[] = this.getWsConfig().get(this.SEARCH_QUERY) || [];
        return _.uniq(recommended);
    }

    private getGeneratorsLocationParams() {
        const location = _.trim(this.getWsConfig().get(this.INSTALLATION_LOCATION));
        return _.isEmpty(location) ? "-g" : `--prefix ${location}`;
    }

    private async exec(arg: string) {
        return util.promisify(cp.exec)(arg);
    }

    private async installGenerator(locationParams: string, genName: string, isInstall = true) {
        this.gensBeingHandled.push(genName);
        const installingMessage = messages.installing(genName);
        let statusbarMessage;
        if (isInstall) {
            statusbarMessage = vscode.window.setStatusBarMessage(installingMessage);
        }

        try {
            this.logger.debug(installingMessage);
            const installCommand = this.getNpmInstallCommand(locationParams, genName);
            this.updateBeingHandledGenerator(genName, true);
            await this.exec(installCommand);
            const successMessage = messages.installed(genName);
            this.logger.debug(successMessage);
            if (isInstall) {
                vscode.window.showInformationMessage(successMessage);
            }
        } catch (error) {
            this.showAndLogError(messages.failed_to_install(genName), error);
        } finally {
            this.removeFromArray(this.gensBeingHandled, genName);
            this.updateBeingHandledGenerator(genName, false);
            if (statusbarMessage) {
                statusbarMessage.dispose();
            }
        }
    }

    private async uninstallGenerator(locationParams: string, genName: string) {
        this.gensBeingHandled.push(genName);
        const uninstallingMessage = messages.uninstalling(genName);
        const statusbarMessage = vscode.window.setStatusBarMessage(uninstallingMessage);

        try {
            this.logger.debug(uninstallingMessage);
            const uninstallCommand = this.getNpmUninstallCommand(locationParams, genName);

            await this.exec(uninstallCommand);
            const successMessage = messages.uninstalled(genName);
            this.logger.debug(successMessage);
            vscode.window.showInformationMessage(successMessage);
        } catch (error) {
            this.showAndLogError(messages.failed_to_uninstall(genName), error);
        } finally {
            this.removeFromArray(this.gensBeingHandled, genName);
            statusbarMessage.dispose();
        }
    }

    private async isInstalled(gen: any) {
        const installedGens: string[] = await this.cachedInstalledGeneratorsPromise;
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
        const customLocation = _.trim(this.getWsConfig().get(this.INSTALLATION_LOCATION));
        const defaultPaths: string[] = env.getNpmPaths();
        if (!_.isEmpty(customLocation)) {
            defaultPaths.push(path.join(customLocation, this.NODE_MODULES));
        }
        
        return _.uniq(defaultPaths);
    }

    private async onEnvLookup(env: Environment.Options, resolve: any) {
        const gensMeta: string[] = env.getGeneratorsMeta();
        const gensFullNames = _.map(gensMeta, (genMeta: any) => {
            const packagePath = genMeta.packagePath;
            const nodeModulesIndex = packagePath.indexOf(this.NODE_MODULES);
            return packagePath.substring(nodeModulesIndex + this.NODE_MODULES.length + 1);
        })
        resolve(_.uniq(gensFullNames));
      }
}
