import * as _ from "lodash";
import { NpmCommand } from "./npm";
import * as customLocation from "./customLocation";
import Environment, { createEnv, type EnvironmentOptions } from "yeoman-environment";
import type { LookupGeneratorMeta } from "@yeoman/types";
import { IChildLogger } from "@vscode-logging/logger";
import { getClassLogger } from "../logger/logger-wrapper";

const GENERATOR = "generator-";
const NAMESPACE = "namespace";

function namespaceToName(ns: string): string {
  const base = ns.replace(/:.*$/, "");
  return base.startsWith("@") ? base.replace(/\/generator-/, "/") : base.replace(/^generator-/, "");
}

export type EnvGen = {
  env: Environment;
  gen: any;
};

export type GeneratorData = {
  generatorMeta: LookupGeneratorMeta;
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
  private allInstalledGensMeta: LookupGeneratorMeta[];

  constructor() {
    try {
      this.logger = getClassLogger(EnvUtil.name);
    } catch (e) {
      // nothing TODO : testing scope
    }
  }

  public loadNpmPath() {
    return this;
  }

  private createEnvInstance(opts?: EnvironmentOptions, adapter?: any): Environment {
    return createEnv({ ...opts, ...(adapter ? { adapter } : {}) });
  }

  private unloadGeneratorModules(genNamespace: string): void {
    let generatorName;
    const genShortName = namespaceToName(genNamespace);
    if (genShortName.startsWith("@")) {
      const firstSlashIndex: number = genShortName.indexOf("/");
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

  private async lookupGensMeta(options?: Parameters<Environment["lookup"]>[0]): Promise<LookupGeneratorMeta[]> {
    return this.createEnvInstance().lookup(options);
  }

  // returns installed generators meta from global and custom installation location
  // custom installation generators have priority over global installed generators when names are identical
  private async lookupAllGensMeta(): Promise<LookupGeneratorMeta[]> {
    const globallyInstalledGensMeta = await this.lookupGensMeta();

    const customNpmPath = customLocation.getNodeModulesPath();
    const customInstalledGensMeta = _.isEmpty(customNpmPath)
      ? []
      : await this.lookupGensMeta({ npmPaths: [customNpmPath] });

    const gensMeta = _.unionBy(customInstalledGensMeta, globallyInstalledGensMeta, NAMESPACE);
    return _.orderBy(gensMeta, [NAMESPACE], ["asc"]);
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
    const npmInstallationPaths = [customLocation.getNodeModulesPath() ?? (await NpmCommand.getGlobalNodeModulesPath())];
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
    const env: Environment = this.createEnvInstance(
      { sharedOptions: { forwardErrorToEnvironment: true } as Record<string, any> },
      adapter,
    );
    // yeoman-environment v6: LookupGeneratorMeta uses `resolved` (path to the generator file),
    // not `generatorPath` (v3 field). env.create() is always async in v6.
    env.register(meta.resolved, { namespace: genNamespace, packagePath: meta.packagePath });
    const gen: any = await env.create(genNamespace, { options } as any);

    return { env, gen };
  }

  public async getGeneratorsData(mainOnly = true): Promise<GeneratorData[]> {
    const gensMeta: LookupGeneratorMeta[] = await this.getGeneratorsMeta(mainOnly);
    const packageJsons = await NpmCommand.getPackageJsons(gensMeta);

    const gensData: GeneratorData[] = _.compact(
      packageJsons.map((generatorPackageJson: any | undefined, index: number) => {
        if (generatorPackageJson) {
          const generatorMeta = gensMeta[index];
          return { generatorMeta, generatorPackageJson };
        }
      }),
    );

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
            generatorMeta: additionalGensMeta[index],
            // populate additional generator properties with main generator package.json
            generatorPackageJson: { ...generatorPackageJson, ...additional[index] },
          };
        }
      });
      gensData.push(...additionalGensData);
    }

    return gensData;
  }

  public async getGeneratorNamesWithOutdatedVersion(): Promise<string[]> {
    const gensMeta: LookupGeneratorMeta[] = await this.getGensMetaByInstallationPath();
    return NpmCommand.getPackageNamesWithOutdatedVersion(this.genMainGensMeta(gensMeta));
  }

  public getGeneratorFullName(genNamespace: string): string {
    const genName = namespaceToName(genNamespace);
    const parts = _.split(genName, "/");
    return _.size(parts) === 1 ? `${GENERATOR}${genName}` : `${parts[0]}/${GENERATOR}${parts[1]}`;
  }
}

export const Env = new EnvUtil();
