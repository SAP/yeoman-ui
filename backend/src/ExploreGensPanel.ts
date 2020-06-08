import * as vscode from 'vscode';
import * as npmFetch from 'npm-registry-fetch';
import * as path from 'path';
import * as _ from 'lodash';
import * as fsextra from 'fs-extra';
import {RpcExtension} from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import * as cp from 'child_process';
import { IChildLogger } from '@vscode-logging/logger';
import { getLogger } from './logger/logger-wrapper';
const util = require('util');
const exec = util.promisify(cp.exec);

const npm = (process.platform === 'win32' ? 'npm.cmd' : 'npm'); 

export class ExploreGensPanel {
    public static readonly viewType = "exploreGens";
	public static extensionPath: string;
	public static currentPanel: ExploreGensPanel;
	private static mediaPath: string;

	public static setPaths(extensionPath: string) {
		ExploreGensPanel.extensionPath = extensionPath;
		ExploreGensPanel.mediaPath = path.join(extensionPath, 'dist', 'media');
    }

    public static setCurrentPanel(webviewPanel: vscode.WebviewPanel) {
		ExploreGensPanel.currentPanel = new ExploreGensPanel(webviewPanel);
    }
    
    public static async exploreGenerators() {
        const webViewPanel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
			'expogens',
			'Explore Generators',
			vscode.ViewColumn.One, {
				enableScripts: true,
				retainContextWhenHidden: true
		});

		let indexHtml = await fsextra.readFile(path.join(ExploreGensPanel.extensionPath, 'dist', 'index.html'), "utf8");
		if (indexHtml) {
		  // Local path to main script run in the webview
		  const scriptPathOnDisk = vscode.Uri.file(path.join(ExploreGensPanel.extensionPath, 'dist', path.sep));
		  const scriptUri = webViewPanel.webview.asWebviewUri(scriptPathOnDisk);

		  // TODO: very fragile: assuming double quotes and src is first attribute
		  // specifically, doesn't work when building vue for development (vue-cli-service build --mode development)
		  indexHtml = indexHtml.replace(/<link href=/g, `<link href=${scriptUri.toString()}`);
		  indexHtml = indexHtml.replace(/<script src=/g, `<script src=${scriptUri.toString()}`);
		  indexHtml = indexHtml.replace(/<img src=/g, `<img src=${scriptUri.toString()}`);
	  	}
		webViewPanel.webview.html = indexHtml;
	}

    private readonly panel: vscode.WebviewPanel;
	private readonly logger: IChildLogger = getLogger();
	private rpc: RpcExtension;
    public constructor(panel: vscode.WebviewPanel) {
        this.panel = panel;
        this.rpc = new RpcExtension(panel.webview);
		this.rpc.setResponseTimeout(3600000);
		this.rpc.registerMethod({ func: this.getFilteredGenerators, thisArg: {} });
		this.rpc.registerMethod({ func: this.doDownload, thisArg: {} });
        this.updateAllInstalledGenerators();
        this.getFilteredGenerators();
    }

    private async doDownload(gen: any) {
        const genName = gen.package.name;
        const locationParams = this.getLocationParams();
        const info = (locationParams === "-g" ? "GLOBAL:" : "CUSTOM:");
        try {
            vscode.window.showInformationMessage(`${info} Installing the latest version of ${genName} ...`);
            await exec(`${npm} install ${locationParams} ${genName}@latest`);
            vscode.window.showInformationMessage(`${info} ${genName} successfully installed.`);
            const config = vscode.workspace.getConfiguration();
            let downloadedGens: string[] | undefined= config.get("Explore Generators.downloadedGenerators");
            if (downloadedGens) {
                downloadedGens.push(genName);
                downloadedGens = _.uniq(downloadedGens);
                config.update("Explore Generators.downloadedGenerators", downloadedGens, true);
            }
        } catch (error) {
            vscode.window.showErrorMessage(error.message || error);
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
        const config = vscode.workspace.getConfiguration();
        const isGlobal = config.get("Explore Generators.installInGlobalNodeModulesPath");
        const location: string | undefined = config.get("Explore Generators.customNodeModulesPath");
        
        return isGlobal ? "" : location;
    }
    
    public getLocationParams() {
        const location = this.getGeneratorsLocation();
        return _.isEmpty(location) ? "-g" : `--prefix ${location}`;
    }
    
    public async updateAllInstalledGenerators() {
        const config = vscode.workspace.getConfiguration();
        const autoUpdateEnabled = config.get("Explore Generators.enableAutoUpdate");
        if (autoUpdateEnabled) {
            const downloadedGenerators: string[] | undefined = config.get("Explore Generators.downloadedGenerators");
            const locationParams = this.getLocationParams();
    
            if (_.size(downloadedGenerators) > 0) {
                vscode.window.showInformationMessage(`Auto updating all downloaded generators...`);
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
