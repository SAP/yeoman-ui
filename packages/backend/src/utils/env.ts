import * as _ from "lodash";
import { homedir } from "os";
import * as path from "path";
import { existsSync } from "fs";
import { isWin32, NpmCommand } from "./npm";
import * as customLocation from "./customLocation";
import * as Environment from "yeoman-environment";
import TerminalAdapter = require("yeoman-environment/lib/adapter");
import { IChildLogger } from "@vscode-logging/logger";
import { getClassLogger } from "../logger/logger-wrapper";

const GENERATOR = "generator-";
const NAMESPACE = "namespace";

export type EnvGen = {
  env: Environment<Environment.Options>;
  gen: any;
};

export type GeneratorData = {
  generatorMeta: Environment.LookupGeneratorMeta;
  generatorPackageJson: any;
};

export class GeneratorNotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class EnvUtil {
  private logger: IChildLogger;
  private existingNpmPathsPromise: Promise<string[]>;
  private allInstalledGensMeta: Environment.LookupGeneratorMeta[];

  constructor() {
    try {
      this.logger = getClassLogger(EnvUtil.name);
    } catch (e) {
      // nothing TODO : testing scope
    }
    this.loadNpmPath();
  }

  public loadNpmPath(force = false) {
    if (_.isNil(this.existingNpmPathsPromise) || force === true) {
      this.existingNpmPathsPromise = this.getExistingNpmPath().then((paths) => {
        this.logger?.debug("existing npm paths", { paths: paths.join(";") });
        return paths;
      });
    }
    return this;
  }

  private getEnvNpmPath(): Promise<string[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // this operation takes up to 2 seconds
        // it should be wrapped with setTimeout to provide promise like behaviour
        resolve(this.createEnvInstance().getNpmPaths());
      }, 1);
    });
  }

  private async getExistingNpmPath(): Promise<string[]> {
    const globalNpmPaths: string[] = await this.getEnvNpmPath();
    const userNpmPaths = homedir()
      .split(path.sep)
      .map((part, index, parts) => {
        const resPath = path.join(...parts.slice(0, index + 1), "node_modules");
        return isWin32 ? resPath : path.join(path.sep, resPath);
      });
    // uniq and existing only paths (global npm path is always added)
    const paths: string[] = _.union(globalNpmPaths, userNpmPaths).filter((npmPath: string) => existsSync(npmPath));
    paths.push(await NpmCommand.getGlobalNodeModulesPath());

    return _.uniq(paths);
  }

  private createEnvInstance(
    args?: string | string[],
    opts?: Environment.Options,
    adapter?: TerminalAdapter,
  ): Environment<Environment.Options> {
    return Environment.createEnv(args, opts, adapter);
  }

  private unloadGeneratorModules(genNamespace: string): void {
    let generatorName;
    const genShortName = Environment.namespaceToName(genNamespace);
    if (genShortName.startsWith("@")) {
      const firstSlashIndex = genShortName.indexOf("/");
      generatorName = `${GENERATOR}${genShortName.substring(firstSlashIndex + 1)}`;
    } else {
      generatorName = `${GENERATOR}${genShortName}`;
    }

    const keys = Object.keys(require.cache);
    for (const key of keys) {
      if (key.includes(generatorName)) {
        delete require.cache[key];
      }
    }
  }

  private lookupGensMeta(options?: Environment.LookupOptions): Environment.LookupGeneratorMeta[] {
    return this.createEnvInstance().lookup(options);
  }

  // returns installed generators meta from global and custom installation location
  // custom installation generators have priority over global installed generators when names are identical
  private async lookupAllGensMeta(): Promise<Environment.LookupGeneratorMeta[]> {
    const globallyInstalledGensMeta = this.lookupGensMeta({ npmPaths: await this.existingNpmPathsPromise });

    const customNpmPath = customLocation.getNodeModulesPath();
    const customInstalledGensMeta = _.isEmpty(customNpmPath) ? [] : this.lookupGensMeta({ npmPaths: [customNpmPath] });

    const gensMeta = _.unionBy(customInstalledGensMeta, globallyInstalledGensMeta, NAMESPACE);
    return _.orderBy(gensMeta, [NAMESPACE], ["asc"]);
  }

  private async getGenMetadata(genNamespace: string): Promise<Environment.LookupGeneratorMeta> {
    this.allInstalledGensMeta = await this.lookupAllGensMeta();

    const genMetadata = this.allInstalledGensMeta.find((genMeta) => genMeta.namespace === genNamespace);
    if (genMetadata) {
      return genMetadata;
    }

    throw new GeneratorNotFoundError(`${genNamespace} generator metadata was not found.`);
  }

  private genMainGensMeta(gensMeta: Environment.LookupGeneratorMeta[]): Environment.LookupGeneratorMeta[] {
    return gensMeta.filter((genMeta) => genMeta.namespace.endsWith(":app"));
  }

  private async getGensMetaByInstallationPath(): Promise<Environment.LookupGeneratorMeta[]> {
    const npmInstallationPaths = [customLocation.getNodeModulesPath() ?? (await NpmCommand.getGlobalNodeModulesPath())];
    return this.lookupGensMeta({ npmPaths: npmInstallationPaths });
  }

  private async getGeneratorsMeta(mainOnly = true): Promise<Environment.LookupGeneratorMeta[]> {
    this.allInstalledGensMeta = await this.lookupAllGensMeta();
    return mainOnly ? this.genMainGensMeta(this.allInstalledGensMeta) : this.allInstalledGensMeta;
  }

  public async getAllGeneratorNamespaces(): Promise<string[]> {
    const gensMeta: Environment.LookupGeneratorMeta[] = await this.getGeneratorsMeta(false);
    return _.map(gensMeta, (genMeta) => genMeta.namespace);
  }

  public async createEnvAndGen(genNamespace: string, options: any, adapter: any): Promise<EnvGen> {
    const meta: Environment.LookupGeneratorMeta = await this.getGenMetadata(genNamespace);
    this.unloadGeneratorModules(genNamespace);
    const env: Environment<Environment.Options> = this.createEnvInstance(
      undefined,
      { sharedOptions: { forwardErrorToEnvironment: true } },
      adapter,
    );
    // @types/yeoman-environment bug: generatorPath is still not exposed on LookupGeneratorMeta
    env.register(_.get(meta, "generatorPath"), genNamespace, meta.packagePath);
    const gen = env.create(genNamespace, { options } as any);
    return { env, gen };
  }

  public async getGeneratorsData(mainOnly = true): Promise<GeneratorData[]> {
    const gensMeta: Environment.LookupGeneratorMeta[] = await this.getGeneratorsMeta(mainOnly);
    const packageJsons = await NpmCommand.getPackageJsons(gensMeta);

    const gensData = packageJsons.map((generatorPackageJson: any | undefined, index: number) => {
      if (generatorPackageJson) {
        const generatorMeta = gensMeta[index];
        return { generatorMeta, generatorPackageJson };
      }
    });

    return _.compact(gensData);
  }

  public async getGeneratorNamesWithOutdatedVersion(): Promise<string[]> {
    const gensMeta: Environment.LookupGeneratorMeta[] = await this.getGensMetaByInstallationPath();
    return NpmCommand.getPackageNamesWithOutdatedVersion(this.genMainGensMeta(gensMeta));
  }

  public getGeneratorFullName(genNamespace: string): string {
    const genName = Environment.namespaceToName(genNamespace);
    const parts = _.split(genName, "/");
    return _.size(parts) === 1 ? `${GENERATOR}${genName}` : `${parts[0]}/${GENERATOR}${parts[1]}`;
  }
}

export const Env = new EnvUtil();
