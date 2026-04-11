"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_USER_REGISTRY_PATH = exports.LEGACY_DATA_DIR = exports.USER_HOME_OVERRIDE_ENV = exports.PACKAGE_NAME = void 0;
exports.resolveUserDataRoot = resolveUserDataRoot;
exports.resolveDefaultUserRegistryPath = resolveDefaultUserRegistryPath;
const os = require("node:os");
const path = require("node:path");
exports.PACKAGE_NAME = "user-habit-pipeline";
exports.USER_HOME_OVERRIDE_ENV = "USER_HABIT_PIPELINE_HOME";
exports.LEGACY_DATA_DIR = path.resolve(__dirname, "..", "data");
exports.LEGACY_USER_REGISTRY_PATH = path.join(exports.LEGACY_DATA_DIR, "user_habits.json");
function resolveUserDataRoot(options = {}) {
    const env = options.env || process.env;
    const platform = options.platform || process.platform;
    const homedir = options.homedir || os.homedir;
    if (env[exports.USER_HOME_OVERRIDE_ENV]) {
        return path.resolve(env[exports.USER_HOME_OVERRIDE_ENV]);
    }
    if (platform === "win32") {
        const base = env.APPDATA || env.LOCALAPPDATA || env.USERPROFILE;
        if (!base) {
            throw new Error(`Unable to determine a Windows user data directory. Set ${exports.USER_HOME_OVERRIDE_ENV}, APPDATA, LOCALAPPDATA, or USERPROFILE.`);
        }
        return path.join(base, exports.PACKAGE_NAME);
    }
    if (env.XDG_CONFIG_HOME) {
        return path.join(env.XDG_CONFIG_HOME, exports.PACKAGE_NAME);
    }
    return path.join(homedir(), ".config", exports.PACKAGE_NAME);
}
function resolveDefaultUserRegistryPath(options = {}) {
    const fileExists = options.fileExists || ((targetPath) => require("node:fs").existsSync(targetPath));
    const preferredRoot = options.preferredRoot || resolveUserDataRoot(options);
    const preferredPath = options.preferredPath || path.join(preferredRoot, "user_habits.json");
    const legacyPath = options.legacyPath || exports.LEGACY_USER_REGISTRY_PATH;
    const preferLegacyFallback = options.preferLegacyFallback !== false;
    if (preferLegacyFallback && !fileExists(preferredPath) && fileExists(legacyPath)) {
        return legacyPath;
    }
    return preferredPath;
}
