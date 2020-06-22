import * as npmFetch from 'npm-registry-fetch';
import * as _ from 'lodash';
import * as cp from 'child_process';
import { IChildLogger } from "@vscode-logging/logger";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import * as util from 'util';
import * as vscode from 'vscode';

const NPM = (process.platform === 'win32' ? 'npm.cmd' : 'npm');

export class ExploreGens {
    private logger: IChildLogger;
    private rpc: IRpc;
    private gensBeingHandled: string[];
    private cachedPromise: Promise<any>;

    constructor(logger: IChildLogger) {
        this.logger = logger;
        this.gensBeingHandled = [];
    }

    public async updateCache() {
        const locationParams = this.getGeneratorsLocationParams();
        const listCommand = `${NPM} list ${locationParams} --depth=0`;
        
        this.cachedPromise = this.exec(listCommand).catch(error => {
            return Promise.resolve(_.get(error, "stdout", ""));
        });
    }

    public initRpc(rpc: IRpc) {
        this.rpc = rpc;
        this.rpc.registerMethod({ func: this.getFilteredGenerators, thisArg: this });
        this.rpc.registerMethod({ func: this.install, thisArg: this });
        this.rpc.registerMethod({ func: this.uninstall, thisArg: this });
        this.rpc.registerMethod({ func: this.isInstalled, thisArg: this });
        this.rpc.registerMethod({ func: this.getRecommendedQuery, thisArg: this });
    }

    public async updateAllInstalledGenerators() {
        const autoUpdateEnabled = this.getWsConfig().get("Yeoman UI.autoUpdateGenerators", true);
        if (autoUpdateEnabled) {
            const installedGenerators: string[] = this.getInstalledGenerators();
            if (!_.isEmpty(installedGenerators)) {
                const updatingMessage = "Auto updating of installed generators...";
                this.logger.debug(updatingMessage);
                const statusBarMessage = vscode.window.setStatusBarMessage(updatingMessage);
                const locationParams = this.getGeneratorsLocationParams();
                const promises = _.map(installedGenerators, genName => {
                    return this.installGenerator(locationParams, genName, false);
                });

                await Promise.all(promises);
                statusBarMessage.dispose();
                vscode.window.setStatusBarMessage("Auto updating of installed generators completed.", 10000);
            }
        }
    }

    private getWsConfig() {
        return vscode.workspace.getConfiguration();
    }

    private async install(gen: any) {
        const genName = gen.package.name;
        const locationParams = this.getGeneratorsLocationParams();
        await this.installGenerator(locationParams, genName);
        this.updateCache();
    }

    private async uninstall(gen: any) {
        const genName = gen.package.name;
        const locationParams = this.getGeneratorsLocationParams();
        await this.uninstallGenerator(locationParams, genName);
        this.updateCache();
    }

    private async getFilteredGenerators(query = "", author = "") {
        const gensQueryUrl = this.getGensQueryURL(query, author);

        try {
            const res: any = await npmFetch.json(gensQueryUrl);
            const filteredGenerators = _.map(_.get(res, "objects"), gen => {
                gen.disabledToHandle = _.includes(this.gensBeingHandled, gen.package.name) ? true : false;
                return gen;
            });
            return [filteredGenerators, res.total];
        } catch (error) {
            this.showAndLogError(`Failed to get generators with the queryUrl ${gensQueryUrl}`, error);
        }
    }

    private showAndLogError(messagePrefix: string, error: any) {
        const errorMessage = error.toString();
        this.logger.error(errorMessage);
        vscode.window.showErrorMessage(`${messagePrefix}: ${errorMessage}`);
    }

    private getGensQueryURL(query: string, recommended: string) {
        const api_endpoint = "http://registry.npmjs.com/-/v1/search?text=";
        let actualQuery = `${query} ${recommended}`;
        actualQuery = _.replace(actualQuery, new RegExp(" ", "g"), "%20");
        return `${api_endpoint}${actualQuery}%20keywords:yeoman-generator%20&size=25&ranking=popularity`;
    }

    private getRecommendedQuery() {
        const recommended: string[] = this.getWsConfig().get("Yeoman UI.recommendedQuery") || [];
        return _.uniq(recommended);
    }

    private getGeneratorsLocationParams() {
        const location = _.trim(this.getWsConfig().get("Yeoman UI.generatorsLocation"));
        return _.isEmpty(location) ? "-g" : `--prefix ${location}`;
    }

    private getInstalledGenerators(): string[] {
        return  [];
    }

    private async exec(arg: string) {
        return util.promisify(cp.exec)(arg);
    }

    private async installGenerator(locationParams: string, genName: string, isInstall = true) {
        this.gensBeingHandled.push(genName);
        const installingMessage = `Installing the latest version of ${genName} ...`;
        let statusbarMessage;
        if (isInstall) {
            statusbarMessage = vscode.window.setStatusBarMessage(installingMessage);
        }

        try {
            this.logger.debug(installingMessage);
            const installCommand = this.getNpmInstallCommand(locationParams, genName);
            this.updateBeingHandledGenerator(genName, true);
            await this.exec(installCommand);
            const successMessage = `${genName} successfully installed.`;
            this.logger.debug(successMessage);
            if (isInstall) {
                vscode.window.showInformationMessage(successMessage);
            }
        } catch (error) {
            this.showAndLogError(`Failed to install ${genName}`, error);
        } finally {
            _.remove(this.gensBeingHandled, gen => {
                return gen === genName;
            });
            this.updateBeingHandledGenerator(genName, false);
            if (statusbarMessage) {
                statusbarMessage.dispose();
            }
        }
    }

    private async uninstallGenerator(locationParams: string, genName: string) {
        this.gensBeingHandled.push(genName);
        const uninstallingMessage = `Uninstalling of ${genName} ...`;
        const statusbarMessage = vscode.window.setStatusBarMessage(uninstallingMessage);

        try {
            this.logger.debug(uninstallingMessage);
            const uninstallCommand = this.getNpmUninstallCommand(locationParams, genName);
            
            await this.exec(uninstallCommand);
            const successMessage = `${genName} successfully uninstalled.`;
            this.logger.debug(successMessage);
            vscode.window.showInformationMessage(successMessage);
        } catch (error) {
            this.showAndLogError(`Failed to uninstall ${genName}`, error);
        } finally {
            _.remove(this.gensBeingHandled, gen => {
                return gen === genName;
            });
            statusbarMessage.dispose();
        }
    }

    private async isInstalled(gen: any) {
        const genName = gen.package.name;
        const result: string = await this.cachedPromise;
        const installedGens = this.getAllInstalledGenerators(result);
        return _.includes(installedGens, genName);
    }

    // TODO - improve logic
    private getAllInstalledGenerators(str: string) {
        let installedGen: string[] = [];
        let tmpGen = "";
        let index;
        let index2;
        let arrGen = str.split("+--");
        for (let i=0 ; i<arrGen.length ; i++){
            index = arrGen[i].indexOf("generator-");
            index2 = arrGen[i].indexOf("@");
            if (index != -1 && index2 != -1) {
                tmpGen = arrGen[i].substring(index,index2);
                installedGen.push(tmpGen);
            }
        }
        return installedGen;
    }

    private updateBeingHandledGenerator(genName: string, isBeingHandled: boolean) {
        this.rpc.invoke("updateBeingHandledGenerator", [genName, isBeingHandled]);
    }

    private getNpmInstallCommand(locationParams: string, genName: string) {
        return `${NPM} install ${locationParams} ${genName}@latest`;
    }

    private getNpmUninstallCommand(locationParams: string, genName: string) {
        return `${NPM} uninstall ${locationParams} ${genName}`;
    }
}
