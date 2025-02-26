import _ from "lodash";
import { IChildLogger } from "@vscode-logging/logger";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { NpmCommand, PackagesData } from "./utils/npm";
import messages from "./exploreGensMessages";
import { Env, GeneratorData } from "./utils/env";
import vscode from "vscode";
import { Constants } from "./utils/constants";

type Disposable = {
  dispose(): void;
};

export enum GenState {
  uninstalling = "uninstalling",
  updating = "updating",
  installing = "installing",
  notInstalled = "notInstalled",
  installed = "installed",
  outdated = "outdated",
}

export class ExploreGens {
  private readonly logger: IChildLogger;
  private rpc: Partial<IRpc>;
  private gensBeingHandled: any[]; // eslint-disable-line @typescript-eslint/prefer-readonly
  private cachedGeneratorsDataPromise: Promise<GeneratorData[]>;
  private readonly context: any;

  private readonly GLOBAL_ACCEPT_LEGAL_NOTE = "global.exploreGens.acceptlegalNote";
  private readonly LAST_AUTO_UPDATE_DATE = "global.exploreGens.lastAutoUpdateDate";
  private readonly SEARCH_QUERY = "ApplicationWizard.searchQuery";
  private readonly AUTO_UPDATE = "ApplicationWizard.autoUpdate";
  private readonly ONE_DAY = 1000 * 60 * 60 * 24;

  constructor(logger: IChildLogger, context?: any) {
    this.context = context;
    this.logger = logger;
    this.gensBeingHandled = [];
    void this.doGeneratorsUpdate();
  }

  public init(rpc: Partial<IRpc>) {
    this.initRpc(rpc);
    this.setInstalledGens();
  }

  public setGenFilter(genFullName: string) {
    return this.rpc.invoke("setGenQuery", [genFullName]);
  }

  private getGeneratorsData(): Promise<GeneratorData[]> {
    return Env.getGeneratorsData();
  }

  private getInstalledGens(): Promise<GeneratorData[]> {
    return this.cachedGeneratorsDataPromise;
  }

  private setInstalledGens() {
    this.cachedGeneratorsDataPromise = this.getGeneratorsData();
  }

  private isLegalNoteAccepted() {
    return Constants.IS_IN_BAS ? this.context.globalState.get(this.GLOBAL_ACCEPT_LEGAL_NOTE, false) : true;
  }

  private async acceptLegalNote() {
    await this.context.globalState.update(this.GLOBAL_ACCEPT_LEGAL_NOTE, true);
    return true;
  }

  private async doGeneratorsUpdate() {
    try {
      const autoUpdateEnabled = this.getWsConfig().get(this.AUTO_UPDATE, true);
      if (autoUpdateEnabled) {
        const lastUpdateDate = this.context.globalState.get(this.LAST_AUTO_UPDATE_DATE, 0);
        const currentDate = Date.now();
        if (currentDate - lastUpdateDate > this.ONE_DAY) {
          this.context.globalState.update(this.LAST_AUTO_UPDATE_DATE, currentDate);
          await NpmCommand.checkAccessAndSetGeneratorsPath();
          await this.updateAllInstalledGenerators();
        }
      }
    } catch (error) {
      this.showAndLogError(messages.failed_to_update_gens(), error);
    }
  }

  private getIsInBAS(): boolean {
    return Constants.IS_IN_BAS;
  }

  private initRpc(rpc: Partial<IRpc>) {
    this.rpc = rpc;
    this.rpc.registerMethod({ func: this.getFilteredGenerators, thisArg: this });
    this.rpc.registerMethod({ func: this.update, thisArg: this });
    this.rpc.registerMethod({ func: this.install, thisArg: this });
    this.rpc.registerMethod({ func: this.uninstall, thisArg: this });
    this.rpc.registerMethod({ func: this.getRecommendedQuery, thisArg: this });
    this.rpc.registerMethod({ func: this.getIsInBAS, thisArg: this });
    this.rpc.registerMethod({ func: this.isLegalNoteAccepted, thisArg: this });
    this.rpc.registerMethod({ func: this.acceptLegalNote, thisArg: this });
  }

  private async updateAllInstalledGenerators() {
    const gensToUpdate: string[] = await Env.getGeneratorNamesWithOutdatedVersion();
    if (!_.isEmpty(gensToUpdate)) {
      this.logger.debug(messages.auto_update_started);
      const statusBarMessage = this.setStatusBarMessage(messages.auto_update_started);
      const promises = _.map(gensToUpdate, (genName) => this.update(genName, true));
      const failedToUpdateGens: any[] = _.compact(await Promise.all(promises));
      if (!_.isEmpty(failedToUpdateGens)) {
        const errMessage = messages.failed_to_update_gens(failedToUpdateGens);
        this.showAndLogError(errMessage);
      }
      this.setInstalledGens();
      statusBarMessage.dispose();
      this.setStatusBarMessage(messages.auto_update_finished, 10000);
    }
  }

  private getWsConfig() {
    return vscode.workspace.getConfiguration();
  }

  private async getFilteredGenerators(query?: string, recommended?: string): Promise<PackagesData> {
    const gensData: GeneratorData[] = await this.getInstalledGens();
    const packagesData: PackagesData = await NpmCommand.getPackagesData(query, recommended);

    const filteredGenerators = _.map(packagesData.packages, (meta) => {
      const genName = meta.package.name;
      const installedGenData = gensData.find((genData) => genData.generatorPackageJson.name === genName);
      meta.state = !!installedGenData ? GenState.installed : GenState.notInstalled;
      if (meta.state === GenState.installed && meta.package.version !== installedGenData.generatorPackageJson.version) {
        meta.state = GenState.outdated;
      }
      meta.disabledToHandle = false;
      const handlingState = this.getHandlingState(genName);
      if (handlingState) {
        meta.state = handlingState;
        meta.disabledToHandle = true;
      }
      return meta;
    });

    return { packages: filteredGenerators, total: packagesData.total };
  }

  private getErrorMessage(error: Error): string {
    return _.get(error, "stack", _.get(error, "message", error.toString()));
  }

  private showAndLogError(messagePrefix: string, error?: Error) {
    if (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(errorMessage);
    }

    vscode.window.showErrorMessage(`${messagePrefix}`);
  }

  private getRecommendedQuery(): string[] {
    const recommended: string[] = this.getWsConfig().get(this.SEARCH_QUERY, []);
    return _.uniq(recommended);
  }

  private notifyGeneratorsChange() {
    return vscode.commands.executeCommand("yeomanUI._notifyGeneratorsChange");
  }

  private setStatusBarMessage(message: string, timeout?: number): Disposable {
    return vscode.window.setStatusBarMessage(message, timeout);
  }

  public async install(gen: any) {
    const genName = gen.package.name;

    this.addToHandled(genName, GenState.installing);
    const installingMessage = messages.installing(genName);
    const statusbarMessage = this.setStatusBarMessage(installingMessage);

    try {
      await NpmCommand.checkAccessAndSetGeneratorsPath();
      this.logger.debug(installingMessage);
      this.updateBeingHandledGenerator(genName, GenState.installing);
      await NpmCommand.install(genName);
      const successMessage = messages.installed(genName);
      this.logger.debug(successMessage);
      vscode.window.showInformationMessage(successMessage);
      this.updateBeingHandledGenerator(genName, GenState.installed);
      await this.notifyGeneratorsChange();
    } catch (error) {
      this.showAndLogError(messages.failed_to_install(genName), error);
      this.updateBeingHandledGenerator(genName, GenState.notInstalled);
    } finally {
      this.finalizeGenerator(genName, statusbarMessage);
    }
  }

  private async uninstall(gen: any) {
    const genName = gen.package.name;
    this.addToHandled(genName, GenState.uninstalling);
    const uninstallingMessage = messages.uninstalling(genName);
    const statusbarMessage = this.setStatusBarMessage(uninstallingMessage);

    try {
      this.logger.debug(uninstallingMessage);
      this.updateBeingHandledGenerator(genName, GenState.uninstalling);
      await NpmCommand.uninstall(genName);
      const successMessage = messages.uninstalled(genName);
      this.logger.debug(successMessage);
      vscode.window.showInformationMessage(successMessage);
      this.updateBeingHandledGenerator(genName, GenState.notInstalled);
      await this.notifyGeneratorsChange();
    } catch (error) {
      this.showAndLogError(messages.failed_to_uninstall(genName), error);
      this.updateBeingHandledGenerator(genName, GenState.installed);
    } finally {
      this.finalizeGenerator(genName, statusbarMessage);
    }
  }

  private async update(gen: any, isAutoUpdate = false): Promise<string | undefined> {
    const genName = _.get(gen.package, "name", gen);
    this.addToHandled(genName, GenState.updating);
    const updatingMessage = messages.updating(genName);
    const statusbarMessage = isAutoUpdate ? undefined : this.setStatusBarMessage(updatingMessage);

    try {
      this.logger.debug(updatingMessage);
      this.updateBeingHandledGenerator(genName, GenState.updating);
      await NpmCommand.install(genName);
      this.logger.debug(messages.updated(genName));
      this.updateBeingHandledGenerator(genName, GenState.installed);
    } catch (error) {
      this.updateBeingHandledGenerator(genName, GenState.notInstalled);
      if (isAutoUpdate) {
        this.logger.error(this.getErrorMessage(error));
        return genName;
      }
      this.showAndLogError(messages.failed_to_update(genName), error);
    } finally {
      this.finalizeGenerator(genName, statusbarMessage);
    }
  }

  private finalizeGenerator(genName: string, statusbarMessage: any) {
    this.removeFromHandled(genName);
    this.setInstalledGens();
    if (statusbarMessage) {
      statusbarMessage.dispose();
    }
  }

  private updateBeingHandledGenerator(genName: string, state: GenState) {
    try {
      void this.rpc?.invoke("updateBeingHandledGenerator", [genName, state]);
    } catch (error) {
      // error could happen in case that panel was closed by an user but action is still in progress
      // in this case webview is already disposed
      this.logger.debug(this.getErrorMessage(error));
    }
  }

  private addToHandled(genName: string, state: GenState) {
    this.gensBeingHandled.push({ name: genName, state });
  }

  private removeFromHandled(genName: string) {
    _.remove(this.gensBeingHandled, (gen) => {
      return gen.name === genName;
    });
  }

  private getHandlingState(genName: string) {
    const gen = _.find(this.gensBeingHandled, (gen) => {
      return gen.name === genName;
    });

    return _.get(gen, "state");
  }
}
