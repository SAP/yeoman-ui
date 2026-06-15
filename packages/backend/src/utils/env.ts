import * as _ from "lodash";
import { NpmCommand } from "./npm";
import * as customLocation from "./customLocation";
import Environment, { createEnv, type EnvironmentOptions } from "yeoman-environment";
import { create as createMemFsEditor } from "mem-fs-editor";
import type { LookupGeneratorMeta } from "@yeoman/types";
import { IChildLogger } from "@vscode-logging/logger";
import { getClassLogger } from "../logger/logger-wrapper";

// Inlined minimal implementations of requireNamespace / toNamespace from @yeoman/namespace.
// @yeoman/namespace is ESM-only and cannot be imported in CJS test environments or reliably
// dynamic-imported at runtime (the package is not present next to the bundled extension.js).
// These two functions are all we need to shim onto the v6 env for yeoman-generator v5 compat.
const _NS_REGEX = {
  name: /^[a-z\d-~][a-z\d-._~]*$/,
  semver: /^[a-z\d-. *+<=>^~]*$/,
  method: /^[\dA-Za-z]\w*$/,
};
function _parseNamespace(complete: string): any {
  if (typeof complete !== "string") throw new TypeError("Must be a string");
  let cursor = 0;
  const parsed: any = { complete, unscoped: "" };
  if (complete.startsWith("@")) {
    const sep = complete.indexOf("/");
    if (sep === -1) return undefined;
    parsed.scope = complete.slice(0, sep);
    cursor = sep + 1;
  }
  const stopTokens = [":", "@", "#", "+", "?"];
  let unscopedEnd = complete.length;
  for (const t of stopTokens) {
    const i = complete.indexOf(t, cursor);
    if (i !== -1 && i < unscopedEnd) unscopedEnd = i;
  }
  const unscoped = complete.slice(cursor, unscopedEnd);
  if (!_NS_REGEX.name.test(unscoped)) return undefined;
  parsed.unscoped = unscoped;
  cursor = unscopedEnd;
  if (complete.charAt(cursor) === ":") {
    cursor++;
    const genStops = ["@", "#", "+", "?"];
    let genEnd = complete.length;
    for (const t of genStops) {
      const i = complete.indexOf(t, cursor);
      if (i !== -1 && i < genEnd) genEnd = i;
    }
    parsed.generator = complete.slice(cursor, genEnd);
    cursor = genEnd;
  }
  // Build a YeomanNamespace-compatible object with a .with() method
  return {
    ...parsed,
    with(newValues: any) {
      return _parseNamespace(complete) ? { ..._parseNamespace(complete), ...newValues, with: this.with } : this;
    },
    toString() {
      return complete;
    },
  };
}
function _requireNamespace(namespace: string): any {
  const parsed = _parseNamespace(namespace);
  if (!parsed) throw new Error(`Error parsing namespace ${namespace}`);
  return parsed;
}
function _toNamespace(namespace: string | object): any {
  if (namespace && (namespace as any).constructor?.name === "YeomanNamespace") return namespace;
  return typeof namespace === "string" ? _parseNamespace(namespace) : undefined;
}

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
    const env = createEnv({ ...opts, ...(adapter ? { adapter } : {}) });
    // Backward compat shims for old generators (yeoman-generator v5 and earlier)
    // that call this.env.requireNamespace() / this.env.toNamespace() directly.
    // These were env instance methods in yeoman-environment v3 but were removed in v6.
    if (!(env as any).requireNamespace) {
      (env as any).requireNamespace = _requireNamespace;
    }
    if (!(env as any).toNamespace) {
      (env as any).toNamespace = _toNamespace;
    }
    // yeoman-generator v5 also checks for env.fs (a mem-fs-editor instance).
    // yeoman-environment v6 only exposes env.sharedFs (raw mem-fs store).
    if (!(env as any).fs) {
      (env as any).fs = createMemFsEditor((env as any).sharedFs);
    }
    // env.error(err) was a v3 method that threw the error; removed in v6.
    // Some generators (e.g. approuter, deployer) call this.env.error() in their abort handler.
    if (!(env as any).error) {
      (env as any).error = (err: any) => {
        throw err instanceof Error ? err : new Error(String(err));
      };
    }
    return env;
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
