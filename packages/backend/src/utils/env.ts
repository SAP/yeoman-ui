import * as _ from "lodash";
import { homedir } from "os";
import * as path from "path";
import { existsSync } from "fs";
import { isWin32, NpmCommand } from "./npm";
import * as customLocation from "./customLocation";
import * as Environment from "yeoman-environment";
import TerminalAdapter = require("yeoman-environment/lib/adapter");

const GENERATOR = "generator-";

export class GeneratorNotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class EnvUtil {
  private readonly existingNpmPaths: string[];
  private allInstalledGensMeta: Environment.LookupGeneratorMeta[];

  constructor() {
    // improves lookup speed by 1.5 sec
    this.existingNpmPaths = (() => {
      const globalNpmPaths = this.createEnvInstance().getNpmPaths();
      const userNpmPaths = homedir()
        .split(path.sep)
        .map((part, index, parts) => {
          const resPath = path.join(
            ...parts.slice(0, index + 1),
            "node_modules"
          );
          return isWin32 ? resPath : path.join(path.sep, resPath);
        });
      // uniq and existing only paths (global npm path is always added)
      const paths: string[] = _.union(
        globalNpmPaths,
        userNpmPaths
      ).filter((npmPath) => existsSync(npmPath));
      paths.push(NpmCommand.getGlobalNodeModulesPath());
      return _.uniq(paths);
    })();
  }

  private createEnvInstance(
    args?: string | string[],
    opts?: Environment.Options,
    adapter?: TerminalAdapter
  ): Environment<Environment.Options> {
    return Environment.createEnv(args, opts, adapter);
  }

  private unloadGeneratorModules(genNamespace: string): void {
    let generatorName;
    const genShortName = Environment.namespaceToName(genNamespace);
    if (genShortName.startsWith("@")) {
      const firstSlashIndex = genShortName.indexOf("/");
      generatorName = `${GENERATOR}${genShortName.substring(
        firstSlashIndex + 1
      )}`;
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

  private _lookupGeneratorsMeta(
    options: any
  ): Environment.LookupGeneratorMeta[] {
    return this.createEnvInstance().lookup(options);
  }

  // returns installed generators meta from global and custom installation location
  private _lookupAllGensMeta(): Environment.LookupGeneratorMeta[] {
    const globallyInstalledGensMeta = this._lookupGeneratorsMeta({
      npmPaths: this.existingNpmPaths,
    });

    const customNpmPath = customLocation.getNodeModulesPath();
    const customInstalledGensMeta = _.isEmpty(customNpmPath)
      ? []
      : this._lookupGeneratorsMeta({ npmPaths: customNpmPath });

    const gensMeta = _.unionBy(
      customInstalledGensMeta,
      globallyInstalledGensMeta,
      "namespace"
    );
    return _.orderBy(gensMeta, ["namespace"], ["asc"]);
  }

  private getGenMetadata(
    genNamespace: string
  ): Environment.LookupGeneratorMeta {
    this.allInstalledGensMeta = this._lookupAllGensMeta();

    const genMetadata = this.allInstalledGensMeta.find(
      (genMeta) => genMeta.namespace === genNamespace
    );
    if (genMetadata) {
      return genMetadata;
    }

    throw new GeneratorNotFoundError(
      `${genNamespace} generator metadata was not found.`
    );
  }

  private genMainModules(gensMeta: Environment.LookupGeneratorMeta[]) {
    return gensMeta.filter((genMeta) => genMeta.namespace.endsWith(":app"));
  }

  public getGenNamespaces(): string[] {
    const gensMeta = this.getGeneratorsMeta(false);
    return _.map(gensMeta, (genMeta) => genMeta.namespace);
  }

  public createEnvAndGen(
    genNamespace: string,
    options: any,
    adapter: any
  ): any {
    const meta = this.getGenMetadata(genNamespace);
    this.unloadGeneratorModules(genNamespace);
    const env = this.createEnvInstance(
      undefined,
      { sharedOptions: { forwardErrorToEnvironment: true } },
      adapter
    );
    // @types/yeoman-environment bug: generatorPath is still not exposed on LookupGeneratorMeta
    env.register(_.get(meta, "generatorPath"), genNamespace, meta.packagePath);
    const gen = env.create(genNamespace, { options });
    return { env, gen };
  }

  public getGeneratorsMeta(mainOnly = true): Environment.LookupGeneratorMeta[] {
    this.allInstalledGensMeta = this._lookupAllGensMeta();
    return mainOnly
      ? this.genMainModules(this.allInstalledGensMeta)
      : this.allInstalledGensMeta;
  }

  public getGeneratorNamesByPath(): string[] {
    const npmPaths =
      customLocation.getNodeModulesPath() ??
      NpmCommand.getGlobalNodeModulesPath();
    const gensMeta = this._lookupGeneratorsMeta({ npmPaths });

    const genFullNames = gensMeta.map((genMeta) =>
      this.getGeneratorFullName(genMeta.namespace)
    );
    return _.uniq(genFullNames);
  }

  public getGeneratorFullName(genNamespace: string) {
    const genName = Environment.namespaceToName(genNamespace);
    const parts = _.split(genName, "/");
    return _.size(parts) === 1
      ? `${GENERATOR}${genName}`
      : `${parts[0]}/${GENERATOR}${parts[1]}`;
  }
}

export const Env = new EnvUtil();
