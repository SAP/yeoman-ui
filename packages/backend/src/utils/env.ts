import _ from "lodash";
import { homedir } from "os";
import path from "path";
import { existsSync } from "fs";
import { isWin32, NpmCommand } from "./npm";
import { getNodeModulesPath} from "./customLocation";
import FullEnvironment, * as Environment from "yeoman-environment";
import type { GeneratorMeta, LookupGeneratorMeta, LookupOptions } from '@yeoman/types';
import { IChildLogger } from "@vscode-logging/logger";
import { getClassLogger } from "../logger/logger-wrapper";
import { EnvironmentOptions } from "yeoman-environment/dist/environment-base";

const GENERATOR = "generator-";
const NAMESPACE = "namespace";

export type EnvGen = {
  env: FullEnvironment;
  gen: any;
};

export type GeneratorData = {
  generatorMeta: GeneratorMeta;
  generatorPackageJson: any;
};

type AdditionalGenerator = {
  namespace: string;
  displayName: string;
  description: string;
  homePage?: string;
  image?: string;
};

export class GeneratorNotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class EnvUtil {
  private logger: IChildLogger;
  private existingNpmPathsPromise: Promise<string[]>;
  private allInstalledGensMeta: LookupGeneratorMeta[];

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
        //@ts-ignore
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
    opts?: EnvironmentOptions,
  ): FullEnvironment {
    return Environment.createEnv(opts);
  }

  private unloadGeneratorModules(genNamespace: string): void {
    let generatorName;
    const genShortName = Env.namespaceToName(genNamespace);
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

  private async lookupGensMeta(options?: LookupOptions): Promise<any> {
    return this.createEnvInstance().lookup(options);
  }

  // returns installed generators meta from global and custom installation location
  // custom installation generators have priority over global installed generators when names are identical
  private async lookupAllGensMeta(): Promise<LookupGeneratorMeta[]> {
    const globallyInstalledGensMeta = await this.lookupGensMeta({ npmPaths: await this.existingNpmPathsPromise });

    const customNpmPath = getNodeModulesPath();
    const customInstalledGensMeta: any = _.isEmpty(customNpmPath) ? [] : await this.lookupGensMeta({ npmPaths: [customNpmPath] });

    const gensMeta = _.unionBy(customInstalledGensMeta, globallyInstalledGensMeta, NAMESPACE);
    return _.orderBy(gensMeta, [NAMESPACE], ["asc"]) as unknown as LookupGeneratorMeta[];
  }

  private async getGenMetadata(genNamespace: string): Promise<LookupGeneratorMeta> {
    this.allInstalledGensMeta = await this.lookupAllGensMeta();

    const genMetadata = this.allInstalledGensMeta.find((genMeta) => genMeta.namespace === genNamespace);
    if (genMetadata) {
      return genMetadata;
    }

    throw new GeneratorNotFoundError(`${genNamespace} generator metadata was not found.`);
  }

  private genMainGensMeta(gensMeta: LookupGeneratorMeta[]): LookupGeneratorMeta[] {
    return gensMeta.filter((genMeta) => genMeta.namespace.endsWith(":app"));
  }

  private async getGensMetaByInstallationPath(): Promise<LookupGeneratorMeta[]> {
    const npmInstallationPaths = [getNodeModulesPath() ?? (await NpmCommand.getGlobalNodeModulesPath())];
    return this.lookupGensMeta({ npmPaths: npmInstallationPaths });
  }

  private async getGeneratorsMeta(mainOnly = true): Promise<LookupGeneratorMeta[]> {
    this.allInstalledGensMeta = await this.lookupAllGensMeta();
    return mainOnly ? this.genMainGensMeta(this.allInstalledGensMeta) : this.allInstalledGensMeta;
  }

  public async getAllGeneratorNamespaces(): Promise<string[]> {
    const gensMeta: LookupGeneratorMeta[] = await this.getGeneratorsMeta(false);
    return _.map(gensMeta, (genMeta) => genMeta.namespace);
  }

  public async createEnvAndGen(genNamespace: string, options: any, adapter: any): Promise<EnvGen> {
    const meta: LookupGeneratorMeta = await this.getGenMetadata(genNamespace);
    this.unloadGeneratorModules(genNamespace);
    const env:FullEnvironment = this.createEnvInstance({ adapter: adapter});
    // @types/yeoman-environment bug: generatorPath is still not exposed on LookupGeneratorMeta
    env.register(_.get(meta, "generatorPath"), meta);
    const gen = env.create(genNamespace, { options } as any);
    return { env, gen };
  }

  public async getGeneratorsData(mainOnly = true): Promise<GeneratorData[]> {
    const gensMeta: LookupGeneratorMeta[] = await this.getGeneratorsMeta(mainOnly);
    const packageJsons = await NpmCommand.getPackageJsons(gensMeta);

    const gensData = packageJsons.map((generatorPackageJson: any | undefined, index: number) => {
      if (generatorPackageJson) {
        const generatorMeta = gensMeta[index] as GeneratorMeta;
        return { generatorMeta, generatorPackageJson };
      }
    });

    // lookup for additional generators
    let additional: AdditionalGenerator[] = [];
    gensData.forEach((genData) => {
      additional = additional.concat(...(genData.generatorPackageJson.additional_generators ?? []));
    });
    // remove duplicates
    additional = _.uniqBy(additional, "namespace");
    // get additional generators data
    if (additional.length) {
      const additionalGensMeta = this.allInstalledGensMeta.filter((genMeta) =>
        additional.find((gen) => gen.namespace === genMeta.namespace),
      );
      const additionalPackageJsons = await NpmCommand.getPackageJsons(additionalGensMeta);
      const additionalGensData = additionalPackageJsons.map((generatorPackageJson: any | undefined, index: number) => {
        if (generatorPackageJson) {
          return {
            generatorMeta: additionalGensMeta[index] as GeneratorMeta,
            // populate additional generator properties with main generator packageon
            generatorPackageJson: { ...generatorPackageJson, ...additional[index] },
          };
        }
      });
      gensData.push(...additionalGensData);
    }

    return _.compact(gensData);
  }

  public async getGeneratorNamesWithOutdatedVersion(): Promise<string[]> {
    const gensMeta: LookupGeneratorMeta[] = await this.getGensMetaByInstallationPath();
    return NpmCommand.getPackageNamesWithOutdatedVersion(this.genMainGensMeta(gensMeta));
  }

  public getGeneratorFullName(genNamespace: string): string {
    const genName = this.namespaceToName(genNamespace);
    const parts = _.split(genName, "/");
    return _.size(parts) === 1 ? `${GENERATOR}${genName}` : `${parts[0]}/${GENERATOR}${parts[1]}`;
  }

  /**
   * Convert a generators namespace to its name
   *
   * @param  {String} namespace
   * @return {String}
   */
  public namespaceToName(namespace: string) {
    return namespace.split(':')[0];
  }

}

export const Env = new EnvUtil();
