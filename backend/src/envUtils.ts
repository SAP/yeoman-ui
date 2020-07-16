import * as os from "os";
import * as path from "path";
import * as _ from "lodash";
import Environment = require("yeoman-environment");

export class EnvironmentUtils {
    public static HOME_DIR = os.homedir();
    public static NODE_MODULES = "node_modules";
    public static isWin32 = (process.platform === 'win32');

    public static getNpmPaths(env: Environment.Options, defaultNpmPaths = env.getNpmPaths()) {
        const parts: string[] = EnvironmentUtils.HOME_DIR.split(path.sep);
        const userPaths = _.map(parts, (part, index) => {
            const resPath = path.join(...parts.slice(0, index + 1), EnvironmentUtils.NODE_MODULES);
            return EnvironmentUtils.isWin32 ? resPath : path.join(path.sep, resPath);
        });

        return _.uniq(userPaths.concat(defaultNpmPaths));
    }
}