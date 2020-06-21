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
    private gensBeingInstalled: string[];

    constructor(logger: IChildLogger) {
        this.logger = logger;
        this.gensBeingInstalled = [];
    }

    public initRpc(rpc: IRpc) {
        this.rpc = rpc;
        this.rpc.registerMethod({ func: this.getFilteredGenerators, thisArg: this });
        this.rpc.registerMethod({ func: this.doDownload, thisArg: this });
        this.rpc.registerMethod({ func: this.getRecommendedQuery, thisArg: this });
    }

    public async updateAllInstalledGenerators() {
        const autoUpdateEnabled = this.getWsConfig().get("Yeoman UI.autoUpdateGenerators");
        if (autoUpdateEnabled) {
            const downloadedGenerators: string[] = this.getDownloadedGenerators();
            if (!_.isEmpty(downloadedGenerators)) {
                const updatingMessage = "Auto updating of downloaded generators...";
                this.logger.debug(updatingMessage);
                const statusBarMessage = vscode.window.setStatusBarMessage(updatingMessage);
                const locationParams = this.getGeneratorsLocationParams();
                const promises = _.map(downloadedGenerators, genName => {
                    return this.installGenerator(locationParams, genName, false);
                });

                await Promise.all(promises);
                statusBarMessage.dispose();
                vscode.window.setStatusBarMessage("Auto updating of downloaded generators completed.", 10000);
            }
        }
    }

    private getWsConfig() {
        return vscode.workspace.getConfiguration();
    }

    private async doDownload(gen: any) {
        const genName = gen.package.name;
        const locationParams = this.getGeneratorsLocationParams();
        await this.installGenerator(locationParams, genName);
        this.addToDownloadedGenerators(genName);
    }

    private addToDownloadedGenerators(genName: string) {
        const downloadedGens: string[] = this.getDownloadedGenerators();
        downloadedGens.push(genName);
        this.getWsConfig().update("Yeoman UI.downloadedGenerators", _.uniq(downloadedGens), true);
    }

    private async getFilteredGenerators(query = "", author = "") {
        const gensQueryUrl = this.getGensQueryURL(query, author);

        try {
            const res: any = await npmFetch.json(gensQueryUrl);
            const filteredGenerators = _.map(_.get(res, "objects"), gen => {
                gen.disabledToDownload = _.includes(this.gensBeingInstalled, gen.package.name) ? true : false;
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

    private getDownloadedGenerators(): string[] {
        return this.getWsConfig().get("Yeoman UI.downloadedGenerators") || [];
    }

    private async exec(arg: string) {
        return util.promisify(cp.exec)(arg);
    }

    private async installGenerator(locationParams: string, genName: string, isDownload = true) {
        this.gensBeingInstalled.push(genName);
        const installingMessage = `Installing the latest version of ${genName} ...`;
        let statusbarMessage;
        if (isDownload) {
            statusbarMessage = vscode.window.setStatusBarMessage(installingMessage);
        }

        try {
            this.logger.debug(installingMessage);
            const installParams = this.getNpmInstallParams(locationParams, genName);
            this.updateWebviewWithBeingInstalledGenerator(genName, true);
            await this.exec(installParams);
            const successMessage = `${genName} successfully installed.`;
            this.logger.debug(successMessage);
            if (isDownload) {
                vscode.window.showInformationMessage(successMessage);
            }
        } catch (error) {
            this.showAndLogError(`Failed to install ${genName}`, error);
        } finally {
            _.remove(this.gensBeingInstalled, gen => {
                return gen === genName;
            });
            this.updateWebviewWithBeingInstalledGenerator(genName, false);
            if (statusbarMessage) {
                statusbarMessage.dispose();
            }
        }
    }

    private updateWebviewWithBeingInstalledGenerator(genName: string, isBeingInstalled: boolean) {
        this.rpc.invoke("updateBeingInstalledGenerator", [genName, isBeingInstalled]);
    }

    private getNpmInstallParams(locationParams: string, genName: string) {
        return `${NPM} install ${locationParams} ${genName}@latest`;
    }
}
