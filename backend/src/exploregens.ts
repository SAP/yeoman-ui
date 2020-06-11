import * as npmFetch from 'npm-registry-fetch';
import * as path from 'path';
import * as _ from 'lodash';
import * as cp from 'child_process';
import { IChildLogger } from "@vscode-logging/logger";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";

const util = require('util');
const exec = util.promisify(cp.exec);
const npm = (process.platform === 'win32' ? 'npm.cmd' : 'npm');

export class ExploreGens {
    private logger: IChildLogger;
    private rpc: IRpc;
    private workspaceConfig: any;

    constructor(rpc: IRpc, logger: IChildLogger, workspaceConfig: any) {
        this.rpc = rpc;
        this.logger = logger;
        this.workspaceConfig = workspaceConfig;

        this.rpc.setResponseTimeout(3600000);
        this.rpc.registerMethod({ func: this.getFilteredGenerators, thisArg: {} });
        this.rpc.registerMethod({ func: this.doDownload, thisArg: {} });
        this.updateAllInstalledGenerators();
        this.getFilteredGenerators();
    }

    private async doDownload(gen: any) {
        const genName = gen.package.name;
        const locationParams = this.getGeneratorsLocationParams();
        const info = (locationParams === "-g" ? "GLOBAL:" : "CUSTOM:");
        try {
            this.logger.debug(`${info} Installing the latest version of ${genName} ...`);
            await exec(`${npm} install ${locationParams} ${genName}@latest`);
            this.logger.debug(`${info} ${genName} successfully installed.`);
            let downloadedGens: string[] | undefined = this.workspaceConfig.get("Explore Generators.downloadedGenerators");
            if (downloadedGens) {
                downloadedGens.push(genName);
                downloadedGens = _.uniq(downloadedGens);
                this.workspaceConfig.update("Explore Generators.downloadedGenerators", downloadedGens, true);
            }
        } catch (error) {
            this.logger.error(error.message || error);
        }
    }

    public async getFilteredGenerators(query = "", author = "") {
        const api_endpoint = "http://registry.npmjs.com/-/v1/search?text=";
        let actualQuery = _.isEmpty(query) ? `generator-` : query;
        actualQuery = _.replace(actualQuery, " ", "%20");
        const res: any = await
            npmFetch.json(`${api_endpoint}${actualQuery}%20keywords:yeoman-generator%20author:${author}&size=25`);
        const filteredGenerators = _.get(res, "results", res.objects);
        this.rpc.invoke("setGenerators", [filteredGenerators, res.total]);
    }

    public getGeneratorsLocation() {
        const generatorsLocation: string = _.trim(this.workspaceConfig.get("Yeoman UI.generatorsLocation"));
        return _.isEmpty(generatorsLocation) ? "" : generatorsLocation;
    }

    public getGeneratorsLocationParams() {
        const location = this.getGeneratorsLocation();
        return _.isEmpty(location) ? "-g" : `--prefix ${location}`;
    }

    public async updateAllInstalledGenerators() {
        const autoUpdateEnabled = this.workspaceConfig.get("Yeoman UI.autoUpdateGenerators");
        if (autoUpdateEnabled) {
            const downloadedGenerators: string[] | undefined = this.workspaceConfig.get("Yeoman UI.downloadedGenerators");
            const locationParams = this.getGeneratorsLocationParams();

            if (_.size(downloadedGenerators) > 0) {
                this.logger.debug(`Auto updating all downloaded generators...`);
            }

            _.forEach(downloadedGenerators, genName => {
                exec(`${npm} install ${locationParams} ${genName}@latest`);
            });
        }
    }

    public getGeneratorsLocationNodeModules() {
        const location: any = this.getGeneratorsLocation();
        return _.isEmpty(location) ? "" : path.join(location, "node_modules");
    }
}
