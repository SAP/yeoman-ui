import * as npmFetch from "npm-registry-fetch";
import * as _ from "lodash";
import * as cp from "child_process";
import { IChildLogger } from "@vscode-logging/logger";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import * as util from "util";
import * as path from "path";
import messages from "./exploreGensMessages";
import Environment = require("yeoman-environment");

export enum GenState {
    uninstalling = "uninstalling",
    updating = "updating",
    installing = "installing",
    notInstalled = "notInstalled",
    installed = "installed"
}

export class ExploreGens {
    public static getInstallationLocation(wsConfig: any) {
        return _.trim(wsConfig.get(ExploreGens.INSTALLATION_LOCATION));
    }

    private static readonly INSTALLATION_LOCATION = "ApplicationWizard.installationLocation";

    private readonly logger: IChildLogger;
    private rpc: IRpc;
    private gensBeingHandled: any[]; // eslint-disable-line @typescript-eslint/prefer-readonly
    private cachedInstalledGeneratorsPromise: Promise<string[]>;
    private readonly context: any;
    private readonly vscode: any;
    private isInBAS: boolean;
    private npmGlobalPaths: string[]; 

    private readonly GLOBAL_ACCEPT_LEGAL_NOTE = "global.exploreGens.acceptlegalNote";
    private readonly LAST_AUTO_UPDATE_DATE = "global.exploreGens.lastAutoUpdateDate";
    private readonly SEARCH_QUERY = "ApplicationWizard.searchQuery";
    private readonly AUTO_UPDATE = "ApplicationWizard.autoUpdate"
    private readonly NPM = (process.platform === "win32" ? "npm.cmd" : "npm");
    private readonly EMPTY = "";
    private readonly SLASH = "/";
    private readonly NODE_MODULES = "node_modules";
    private readonly GENERATOR = "generator-";
    private readonly ONE_DAY = 1000 * 60 * 60 * 24;
    private readonly NPM_REGISTRY_HOST = _.get(process, "env.NPM_CFG_REGISTRY", "http://registry.npmjs.com/");
    private readonly SEARCH_QUERY_PREFIX = `${this.NPM_REGISTRY_HOST}-/v1/search?text=`;
    private readonly SEARCH_QUERY_SUFFIX = "keywords:yeoman-generator &size=25&ranking=popularity";

    constructor(logger: IChildLogger, npmGlobalPaths: string[], isInBAS: boolean, context?: any, vscode?: any) {
        this.context = context;
        this.vscode = vscode;
        this.logger = logger;
        this.gensBeingHandled = [];
        this.npmGlobalPaths = npmGlobalPaths;
		this.doGeneratorsUpdate();
		this.isInBAS = isInBAS;
    }

    public init(rpc: IRpc) {
        this.initRpc(rpc);
        this.setInstalledGens();
    }

    private async getInstalledGens() {
        return this.cachedInstalledGeneratorsPromise;
    }

    private setInstalledGens() {
        this.cachedInstalledGeneratorsPromise = this.getAllInstalledGenerators();
    }

    private async isLegalNoteAccepted() {
        return this.isInBAS ? this.context.globalState.get(this.GLOBAL_ACCEPT_LEGAL_NOTE, false) : true;
    }

    private async acceptLegalNote() {
        await this.context.globalState.update(this.GLOBAL_ACCEPT_LEGAL_NOTE, true);
        return true;
    }

    private async doGeneratorsUpdate() {
        const lastUpdateDate = this.context.globalState.get(this.LAST_AUTO_UPDATE_DATE, 0);
        const currentDate = Date.now();
        if ((currentDate - lastUpdateDate) > this.ONE_DAY) {
            this.context.globalState.update(this.LAST_AUTO_UPDATE_DATE, currentDate);
            const autoUpdateEnabled = this.getWsConfig().get(this.AUTO_UPDATE, true);
            if (autoUpdateEnabled) {
                await this.updateAllInstalledGenerators();
            }
        }
	}
	
	private getInBAS(): boolean {
		return this.isInBAS;
	}

    private initRpc(rpc: IRpc) {
        this.rpc = rpc;
        this.rpc.registerMethod({ func: this.getFilteredGenerators, thisArg: this });
        this.rpc.registerMethod({ func: this.install, thisArg: this });
        this.rpc.registerMethod({ func: this.uninstall, thisArg: this });
        this.rpc.registerMethod({ func: this.isInstalled, thisArg: this });
        this.rpc.registerMethod({ func: this.getRecommendedQuery, thisArg: this });
        this.rpc.registerMethod({ func: this.getInBAS, thisArg: this });
        this.rpc.registerMethod({ func: this.isLegalNoteAccepted, thisArg: this });
        this.rpc.registerMethod({ func: this.acceptLegalNote, thisArg: this });
    }

    private async updateAllInstalledGenerators() {
        const installedGenerators: string[] = await this.getAllInstalledGenerators();
        if (!_.isEmpty(installedGenerators)) {
            this.logger.debug(messages.auto_update_started);
            const statusBarMessage = this.vscode.window.setStatusBarMessage(messages.auto_update_started);
            const locationParams = this.getGeneratorsLocationParams();
            const promises = _.map(installedGenerators, genName => {
                return this.update(locationParams, genName);
            });

            await Promise.all(promises);
            this.setInstalledGens();
            statusBarMessage.dispose();
            this.vscode.window.setStatusBarMessage(messages.auto_update_finished, 10000);
        }
    }

    private getWsConfig() {
        return this.vscode.workspace.getConfiguration();
    }

    private async getFilteredGenerators(query?: string, author?: string) {
        query = query || this.EMPTY;
        author = author || this.EMPTY;
        const gensQueryUrl = this.getGensQueryURL(query, author);

        try {
            const cachedGens = await this.getInstalledGens();
            const res: any = await npmFetch.json(gensQueryUrl);
            const filteredGenerators = _.map(_.get(res, "objects"), gen => {
                const genName = gen.package.name;
                gen.state = _.includes(cachedGens, genName) ? GenState.installed : GenState.notInstalled;
                gen.disabledToHandle = false;
                const handlingState = this.getHandlingState(genName);
                if (handlingState) {
                    gen.state = handlingState;
                    gen.disabledToHandle = true;
                }
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
	
	private notifyGeneratorsChange() {
		try {
			return this.vscode.commands.executeCommand("yeomanUI._notifyGeneratorsChange");
		} catch (error) {
			this.showAndLogError(error.message, error);
		}
	}

    private async install(gen: any) {
        const genName = gen.package.name;
        this.addToHandled(genName, GenState.installing);
        const installingMessage = messages.installing(genName);
        const statusbarMessage = this.vscode.window.setStatusBarMessage(installingMessage);

        try {
            this.logger.debug(installingMessage);
            this.updateBeingHandledGenerator(genName, GenState.installing);
            const locationParams = this.getGeneratorsLocationParams();
            const installCommand = this.getNpmInstallCommand(locationParams, genName);
            await this.exec(installCommand);
            const successMessage = messages.installed(genName);
            this.logger.debug(successMessage);
            this.vscode.window.showInformationMessage(successMessage);
			this.updateBeingHandledGenerator(genName, GenState.installed);
			await this.notifyGeneratorsChange();
        } catch (error) {
            this.showAndLogError(messages.failed_to_install(genName), error);
            this.updateBeingHandledGenerator(genName, GenState.notInstalled);
        } finally {
            this.removeFromHandled(genName);
            this.setInstalledGens();
            statusbarMessage.dispose();
        }
    }

    private async uninstall(gen: any) {
        const genName = gen.package.name;
        this.addToHandled(genName, GenState.uninstalling);
        const uninstallingMessage = messages.uninstalling(genName);
        const statusbarMessage = this.vscode.window.setStatusBarMessage(uninstallingMessage);

        try {
            this.logger.debug(uninstallingMessage);
            this.updateBeingHandledGenerator(genName, GenState.uninstalling);
            const locationParams = this.getGeneratorsLocationParams();
            const uninstallCommand = this.getNpmUninstallCommand(locationParams, genName);
            await this.exec(uninstallCommand);
            const successMessage = messages.uninstalled(genName);
            this.logger.debug(successMessage);
            this.vscode.window.showInformationMessage(successMessage);
			this.updateBeingHandledGenerator(genName, GenState.notInstalled);
			await this.notifyGeneratorsChange();
        } catch (error) {
            this.showAndLogError(messages.failed_to_uninstall(genName), error);
            this.updateBeingHandledGenerator(genName, GenState.installed);
        } finally {
            this.removeFromHandled(genName);
            this.setInstalledGens();
            statusbarMessage.dispose();
        }
    }

    private async update(locationParams: string, genName: string) {
        this.addToHandled(genName, GenState.updating);

        try {
            this.logger.debug(messages.updating(genName));
            this.updateBeingHandledGenerator(genName, GenState.updating);
            const installCommand = this.getNpmInstallCommand(locationParams, genName);
            await this.exec(installCommand);
            this.logger.debug(messages.updated(genName));
            this.updateBeingHandledGenerator(genName, GenState.installed);
        } catch (error) {
            this.showAndLogError(messages.failed_to_update(genName), error);
            this.updateBeingHandledGenerator(genName, GenState.notInstalled);
        } finally {
            this.removeFromHandled(genName);
        }
    }

    private async updateBeingHandledGenerator(genName: string, state: GenState) {
        this.rpc.invoke("updateBeingHandledGenerator", [genName, state]);
    }

    private addToHandled(genName: string, state: GenState) {
        this.gensBeingHandled.push({ name: genName, state });
    }

    private removeFromHandled(genName: string) {
        _.remove(this.gensBeingHandled, gen => {
            return gen.name === genName;
        });
    }

    private getHandlingState(genName: string) {
        const gen = _.find(this.gensBeingHandled, gen => {
            return gen.name === genName;
        });

        return _.get(gen, "state");
    }

    private async isInstalled(gen: any) {
        const installedGens: string[] = await this.getInstalledGens();
        return _.includes(installedGens, gen.package.name);
    }

    private getNpmInstallCommand(locationParams: string, genName: string) {
        return `${this.NPM} install ${locationParams} ${genName}@latest`;
    }

    private getNpmUninstallCommand(locationParams: string, genName: string) {
        return `${this.NPM} uninstall ${locationParams} ${genName}`;
    }

    private async getAllInstalledGenerators(): Promise<string[]> {
        const npmPaths = await this.getNpmPaths();
        return new Promise(resolve => {
            const yoEnv: Environment.Options = Environment.createEnv();
            yoEnv.lookup({ npmPaths }, async () => this.onEnvLookup(yoEnv, resolve));
        });
    }

    private async getNpmPaths() {
        const customLocation = ExploreGens.getInstallationLocation(this.getWsConfig());
        if (_.isEmpty(customLocation)) {
            return this.npmGlobalPaths;
        }

        return [path.join(customLocation, this.NODE_MODULES)];
    }

    private onEnvLookup(env: Environment.Options, resolve: any) {
        const genNames = env.getGeneratorNames();
        const gensFullNames = _.map(genNames, genName => {
            const parts = _.split(genName, this.SLASH);
            return _.size(parts) === 1 ? `${this.GENERATOR}${genName}` : `${parts[0]}${this.SLASH}${this.GENERATOR}${parts[1]}`;
        });

        resolve(gensFullNames);
    }
}
