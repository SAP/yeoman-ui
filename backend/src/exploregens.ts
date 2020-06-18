import * as npmFetch from 'npm-registry-fetch';
import * as _ from 'lodash';
import * as cp from 'child_process';
import { IChildLogger } from "@vscode-logging/logger";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import * as util from 'util';
import * as vscode from 'vscode';

const npm = (process.platform === 'win32' ? 'npm.cmd' : 'npm');

export class ExploreGens {
    private logger: IChildLogger;
    private rpc: IRpc;
    private workspaceConfig: any;
    private gensBeingInstalled: string[];

    constructor(rpc: IRpc, logger: IChildLogger, workspaceConfig: any) {
        this.rpc = rpc;
        this.logger = logger;
        this.workspaceConfig = workspaceConfig;
        this.gensBeingInstalled = [];
        this.init();
    }

    private init() {
        this.rpc.setResponseTimeout(3600000);
        this.rpc.registerMethod({ func: this.getFilteredGenerators, thisArg: this });
        this.rpc.registerMethod({ func: this.doDownload, thisArg: this });
        this.rpc.registerMethod({ func: this.getRecommendedQuery, thisArg: this });
        this.updateAllInstalledGenerators();
    }

    private async doDownload(gen: any) {
        const genName = gen.package.name;
        const locationParams = this.getGeneratorsLocationParams();
        
        await this.installGenerator(locationParams, genName);
        
        vscode.window.showInformationMessage(`${genName} successfully installed.`);

        this.addToDownloadedGenerators(genName);
    }

    private addToDownloadedGenerators(genName: string) {
        const downloadedGens: string[] = this.getDownloadedGenerators();
            downloadedGens.push(genName);
            this.workspaceConfig.update("Yeoman UI.downloadedGenerators", _.uniq(downloadedGens), true);
    }

    private async getFilteredGenerators(query = "", author = "") {
        const gensQueryUrl = this.getGensQueryURL(query, author);
        const res: any = await npmFetch.json(gensQueryUrl); 
        let filteredGenerators = _.get(res, "results", res.objects);
        filteredGenerators = _.map(filteredGenerators, gen => {
            if (_.includes(this.gensBeingInstalled, gen.package.name)) {
                gen.disabledToDownload = true;
            } else {
                gen.disabledToDownload = false;
            }

            return gen;
        });
        return [filteredGenerators, res.total];
    }

    private getGensQueryURL(query: string, recommended: string) {
        const api_endpoint = "http://registry.npmjs.com/-/v1/search?text=";
        let actualQuery = `${query} ${recommended}`;
        actualQuery = _.replace(actualQuery, new RegExp(" ", "g"), "%20");
        return `${api_endpoint}${actualQuery}%20keywords:yeoman-generator%20&size=25&ranking=popularity`;
    }

    private getRecommendedQuery() {
        const recommended: string[] = this.workspaceConfig.get("Yeoman UI.recommendedQuery") || [];
        return _.uniq(recommended);
    }

    private getGeneratorsLocationParams() {
        const location =  _.trim(this.workspaceConfig.get("Yeoman UI.generatorsLocation"));
        return _.isEmpty(location) ? "-g": `--prefix ${location}`;
    }

    private updateAllInstalledGenerators() {
        const autoUpdateEnabled = this.workspaceConfig.get("Yeoman UI.autoUpdateGenerators");
        if (autoUpdateEnabled) {
            const downloadedGenerators: string[] = this.getDownloadedGenerators();
            const locationParams = this.getGeneratorsLocationParams();

            if (_.size(downloadedGenerators) > 0) {
                const updatingMessage = "Auto updating all downloaded generators...";
                this.logger.debug(updatingMessage);
                vscode.window.setStatusBarMessage(updatingMessage, 8000);
            }

            _.forEach(downloadedGenerators, genName => {
                this.installGenerator(locationParams, genName);
            });
        }
    }

    private getDownloadedGenerators(): string[] {
        return this.workspaceConfig.get("Yeoman UI.downloadedGenerators") || [];
    }

    private async exec(arg: string) {
        return util.promisify(cp.exec)(arg);
    }

    private async installGenerator(locationParams: string, genName: string) {
        this.gensBeingInstalled.push(genName);
        const installingMessage = `Installing the latest version of ${genName} ...`;
        const statusbarMessage = vscode.window.setStatusBarMessage(installingMessage, 3000);

        try {
            this.logger.debug(installingMessage);
            const installParams = this.getNpmInstallParams(locationParams, genName);
            this.rpc.invoke("updateBeingInstalledGenerator", [genName, true]);
            await this.exec(installParams);
            this.logger.debug(`${genName} successfully installed.`);
        } catch (error) {
            const errorMessage = error.message || error.toString();
            this.logger.error(errorMessage);
            vscode.window.showErrorMessage(`Failed to install ${genName}: ${errorMessage}`);
        } finally {
            _.remove(this.gensBeingInstalled, gen => {
                return gen === genName;
            });
            this.rpc.invoke("updateBeingInstalledGenerator", [genName, false]);
            statusbarMessage.dispose();
        }
    }

    private getNpmInstallParams(locationParams: string, genName: string) {
        return `${npm} install ${locationParams} ${genName}@latest`;
    }
}
