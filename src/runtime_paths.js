const os = require("node:os");
const path = require("node:path");

const PACKAGE_NAME = "user-habit-pipeline";
const USER_HOME_OVERRIDE_ENV = "USER_HABIT_PIPELINE_HOME";
const LEGACY_DATA_DIR = path.resolve(__dirname, "..", "data");
const LEGACY_USER_REGISTRY_PATH = path.join(LEGACY_DATA_DIR, "user_habits.json");

function resolveUserDataRoot(options = {}) {
  const env = options.env || process.env;
  const platform = options.platform || process.platform;
  const homedir = options.homedir || os.homedir;

  if (env[USER_HOME_OVERRIDE_ENV]) {
    return path.resolve(env[USER_HOME_OVERRIDE_ENV]);
  }

  if (platform === "win32") {
    const base = env.APPDATA || env.LOCALAPPDATA || env.USERPROFILE;
    if (!base) {
      throw new Error(
        `Unable to determine a Windows user data directory. Set ${USER_HOME_OVERRIDE_ENV}, APPDATA, LOCALAPPDATA, or USERPROFILE.`
      );
    }

    return path.join(base, PACKAGE_NAME);
  }

  if (env.XDG_CONFIG_HOME) {
    return path.join(env.XDG_CONFIG_HOME, PACKAGE_NAME);
  }

  return path.join(homedir(), ".config", PACKAGE_NAME);
}

function resolveDefaultUserRegistryPath(options = {}) {
  const fileExists = options.fileExists || ((targetPath) => require("node:fs").existsSync(targetPath));
  const preferredRoot = options.preferredRoot || resolveUserDataRoot(options);
  const preferredPath = options.preferredPath || path.join(preferredRoot, "user_habits.json");
  const legacyPath = options.legacyPath || LEGACY_USER_REGISTRY_PATH;
  const preferLegacyFallback = options.preferLegacyFallback !== false;

  if (preferLegacyFallback && !fileExists(preferredPath) && fileExists(legacyPath)) {
    return legacyPath;
  }

  return preferredPath;
}

module.exports = {
  LEGACY_DATA_DIR,
  LEGACY_USER_REGISTRY_PATH,
  PACKAGE_NAME,
  USER_HOME_OVERRIDE_ENV,
  resolveDefaultUserRegistryPath,
  resolveUserDataRoot
};
