import * as npmFetch from 'npm-registry-fetch';
import * as _ from 'lodash';
import * as cp from 'child_process';
import { IChildLogger } from "@vscode-logging/logger";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import * as util from 'util';

const npm = (process.platform === 'win32' ? 'npm.cmd' : 'npm');

export class ExploreGens {
    private logger: IChildLogger;
    private rpc: IRpc;
    private workspaceConfig: any;

    constructor(rpc: IRpc, logger: IChildLogger, workspaceConfig: any) {
        this.rpc = rpc;
        this.logger = logger;
        this.workspaceConfig = workspaceConfig;
        this.init();
    }

    private init() {
        this.rpc.setResponseTimeout(3600000);
        this.rpc.registerMethod({ func: this.getFilteredGenerators, thisArg: this });
        this.rpc.registerMethod({ func: this.doDownload, thisArg: this });
        this.rpc.registerMethod({ func: this.getGeneratorsAuthors, thisArg: this });
        this.updateAllInstalledGenerators();
    }

    private async doDownload(gen: any) {
        const genName = gen.package.name;
        const locationParams = this.getGeneratorsLocationParams();
        try {
            this.logger.debug(`Installing the latest version of ${genName} ...`);
            await this.exec(this.getNpmInstallParams(locationParams, genName));
            this.logger.debug(`${genName} successfully installed.`);
            let downloadedGens: string[] = this.workspaceConfig.get("Yeoman UI.downloadedGenerators") || [];
            downloadedGens.push(genName);
            downloadedGens = _.uniq(downloadedGens);
            this.workspaceConfig.update("Yeoman UI.downloadedGenerators", downloadedGens, true);
        } catch (error) {
            this.logger.error(error.message || error);
        }
    }

    private async getFilteredGenerators(query = "", author = "") {
        const gensQueryUrl = this.getGensQueryURL(query, author);
        const res: any = await npmFetch.json(gensQueryUrl); 
        const filteredGenerators = _.get(res, "results", res.objects);
        return [filteredGenerators, res.total];
    }

    private getGensQueryURL(query: string, author: string) {
        const api_endpoint = "http://registry.npmjs.com/-/v1/search?text=";
        let actualQuery = _.isEmpty(query) ? `generator-` : query;
        actualQuery = _.replace(actualQuery, new RegExp(" ", "g"), "%20");
        return `${api_endpoint}${actualQuery}%20keywords:yeoman-generator%20author:${author}&size=25`;
    }

    private getGeneratorsAuthors() {
        const authors: string[] = this.workspaceConfig.get("Yeoman UI.generatorAuthors") || [];
        return _.uniq(authors);
    }

    private getGeneratorsLocationParams() {
        const location =  _.trim(this.workspaceConfig.get("Yeoman UI.generatorsLocation"));
        return _.isEmpty(location) ? "-g" : `--prefix ${location}`;
    }

    private updateAllInstalledGenerators() {
        const autoUpdateEnabled = this.workspaceConfig.get("Yeoman UI.autoUpdateGenerators");
        if (autoUpdateEnabled) {
            const downloadedGenerators: string[] | undefined = this.workspaceConfig.get("Yeoman UI.downloadedGenerators");
            const locationParams = this.getGeneratorsLocationParams();

            if (_.size(downloadedGenerators) > 0) {
                this.logger.debug("Auto updating all downloaded generators...");
            }

            _.forEach(downloadedGenerators, genName => {
                this.exec(this.getNpmInstallParams(locationParams, genName));
            });
        }
    }

    private async exec(arg: string) {
        return util.promisify(cp.exec)(arg);
    }

    private getNpmInstallParams(locationParams: string, genName: string) {
        return `${npm} install ${locationParams} ${genName}@latest`;
    }
}
