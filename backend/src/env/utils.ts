import Environment = require("yeoman-environment");
import * as os from "os";
import * as _ from "lodash";

export const NODE_MODULES = "node_modules";
export const isWin32 = (process.platform === "win32");
export const HOME_DIR = os.homedir();
export const APP = ":app";

export function getGeneratorsMeta(npmPaths?: any): Promise<any> {
    return new Promise(resolve => {
        const env: Environment.Options = Environment.createEnv();
        env.lookup({ npmPaths }, () => {
            resolve(env.getGeneratorsMeta());
        });
    });
}
