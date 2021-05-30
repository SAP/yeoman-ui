import * as _ from "lodash";
import { IChildLogger } from "@vscode-logging/logger";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { NpmCommand } from "./utils/npm";
import messages from "./exploreGensMessages";
import { Env } from "./utils/env";
import { vscode } from "./utils/vscodeProxy";

export enum GenState {
  uninstalling = "uninstalling",
  updating = "updating",
  installing = "installing",
  notInstalled = "notInstalled",
  installed = "installed",
}

export class ExploreGens {
  private readonly logger: IChildLogger;
  private rpc: Partial<IRpc>;
  private gensBeingHandled: any[]; // eslint-disable-line @typescript-eslint/prefer-readonly
  private cachedInstalledGenerators: string[];
  private readonly context: any;
  private isInBAS: boolean; // eslint-disable-line @typescript-eslint/prefer-readonly

  private readonly GLOBAL_ACCEPT_LEGAL_NOTE = "global.exploreGens.acceptlegalNote";
  private readonly LAST_AUTO_UPDATE_DATE = "global.exploreGens.lastAutoUpdateDate";
  private readonly SEARCH_QUERY = "ApplicationWizard.searchQuery";
  private readonly AUTO_UPDATE = "ApplicationWizard.autoUpdate";
  private readonly EMPTY = "";
  private readonly ONE_DAY = 1000 * 60 * 60 * 24;

  constructor(logger: IChildLogger, isInBAS: boolean, context?: any) {
    this.context = context;
    this.logger = logger;
    this.gensBeingHandled = [];
    void this.doGeneratorsUpdate();
    this.isInBAS = isInBAS;
  }

  public init(rpc: Partial<IRpc>) {
    this.initRpc(rpc);
    this.setInstalledGens();
  }

  public setGenFilter(genFullName: string) {
    return this.rpc.invoke("setGenQuery", [genFullName]);
  }

  private getAllInstalledGenerators(): string[] {
    return Env.getGeneratorNames();
  }

  private getInstalledGens(): string[] {
    return this.cachedInstalledGenerators;
  }

  private setInstalledGens() {
    this.cachedInstalledGenerators = this.getAllInstalledGenerators();
  }

  private isLegalNoteAccepted() {
    return this.isInBAS ? this.context.globalState.get(this.GLOBAL_ACCEPT_LEGAL_NOTE, false) : true;
  }

  private async acceptLegalNote() {
    await this.context.globalState.update(this.GLOBAL_ACCEPT_LEGAL_NOTE, true);
    return true;
  }

  private async doGeneratorsUpdate() {
    try {
      const lastUpdateDate = this.context.globalState.get(this.LAST_AUTO_UPDATE_DATE, 0);
      const currentDate = Date.now();
      if (currentDate - lastUpdateDate > this.ONE_DAY) {
        this.context.globalState.update(this.LAST_AUTO_UPDATE_DATE, currentDate);
        const autoUpdateEnabled = this.getWsConfig().get(this.AUTO_UPDATE, true);
        if (autoUpdateEnabled) {
          await NpmCommand.checkAccessAndSetGeneratorsPath();
          await this.updateAllInstalledGenerators();
        }
      }
    } catch (error) {
      this.showAndLogError("Update Failure", error);
    }
  }

  private getIsInBAS(): boolean {
    return this.isInBAS;
  }

  private initRpc(rpc: Partial<IRpc>) {
    this.rpc = rpc;
    this.rpc.registerMethod({
      func: this.getFilteredGenerators,
      thisArg: this,
    });
    this.rpc.registerMethod({ func: this.install, thisArg: this });
    this.rpc.registerMethod({ func: this.uninstall, thisArg: this });
    this.rpc.registerMethod({ func: this.isInstalled, thisArg: this });
    this.rpc.registerMethod({ func: this.getRecommendedQuery, thisArg: this });
    this.rpc.registerMethod({ func: this.getIsInBAS, thisArg: this });
    this.rpc.registerMethod({ func: this.isLegalNoteAccepted, thisArg: this });
    this.rpc.registerMethod({ func: this.acceptLegalNote, thisArg: this });
  }

  private async updateAllInstalledGenerators() {
    const gensToUpdate: string[] = await Env.getGeneratorNamesWithOutdatedVersion();
    if (!_.isEmpty(gensToUpdate)) {
      this.logger.debug(messages.auto_update_started);
      const statusBarMessage = vscode.window.setStatusBarMessage(messages.auto_update_started);
      const promises = _.map(gensToUpdate, (genName) => this.update(genName));
      const failedToUpdateGens: any[] = _.compact(await Promise.all(promises));
      if (!_.isEmpty(failedToUpdateGens)) {
        const errMessage = messages.failed_to_update_gens(failedToUpdateGens);
        this.showAndLogError("Update Failure", errMessage);
      }
      this.setInstalledGens();
      statusBarMessage.dispose();
      vscode.window.setStatusBarMessage(messages.auto_update_finished, 10000);
    }
  }

  private getWsConfig() {
    return vscode.workspace.getConfiguration();
  }

  private async getFilteredGenerators(query?: string, author?: string) {
    try {
      const cachedGens = this.getInstalledGens();
      const packagesMeta: any = await NpmCommand.getPackagesMetadata(query, author);
      const filteredGenerators = _.map(packagesMeta.objects, (meta) => {
        const genName = meta.package.name;
        meta.state = _.includes(cachedGens, genName) ? GenState.installed : GenState.notInstalled;
        meta.disabledToHandle = false;
        const handlingState = this.getHandlingState(genName);
        if (handlingState) {
          meta.state = handlingState;
          meta.disabledToHandle = true;
        }
        return meta;
      });

      return [filteredGenerators, packagesMeta.total];
    } catch (error) {
      this.showAndLogError(messages.failed_to_get_outdated_gens, error);
    }
  }

  private showAndLogError(messagePrefix: string, error: any) {
    const errorMessage = error.toString();
    this.logger.error(errorMessage);
    vscode.window.showErrorMessage(`${messagePrefix}: ${errorMessage}`);
  }

  private getRecommendedQuery() {
    const recommended: string[] = this.getWsConfig().get(this.SEARCH_QUERY) || [];
    return _.uniq(recommended);
  }

  private notifyGeneratorsChange() {
    return vscode.commands.executeCommand("yeomanUI._notifyGeneratorsChange");
  }

  public async install(gen: any) {
    const genName = gen.package.name;

    this.addToHandled(genName, GenState.installing);
    const installingMessage = messages.installing(genName);
    const statusbarMessage = vscode.window.setStatusBarMessage(installingMessage);

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
      this.removeFromHandled(genName);
      this.setInstalledGens();
      statusbarMessage.dispose();
    }
  }

  private async uninstall(gen: any) {
    const genName = gen.package.name;
    this.addToHandled(genName, GenState.uninstalling);
    const uninstallingMessage = messages.uninstalling(genName);
    const statusbarMessage = vscode.window.setStatusBarMessage(uninstallingMessage);

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
      this.removeFromHandled(genName);
      this.setInstalledGens();
      statusbarMessage.dispose();
    }
  }

  private async update(genName: string): Promise<string | undefined> {
    this.addToHandled(genName, GenState.updating);

    try {
      this.logger.debug(messages.updating(genName));
      this.updateBeingHandledGenerator(genName, GenState.updating);
      await NpmCommand.install(genName);
      this.logger.debug(messages.updated(genName));
      this.updateBeingHandledGenerator(genName, GenState.installed);
    } catch (error) {
      this.updateBeingHandledGenerator(genName, GenState.notInstalled);
      this.logger.error(error);
      return genName;
    } finally {
      this.removeFromHandled(genName);
    }
  }

  private updateBeingHandledGenerator(genName: string, state: GenState) {
    if (this.rpc) {
      void this.rpc.invoke("updateBeingHandledGenerator", [genName, state]);
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

  private isInstalled(gen: any) {
    const installedGens: string[] = this.getInstalledGens();
    return _.includes(installedGens, gen.package.name);
  }
}
