import os = require("node:os");
interface ResolveUserDataRootOptions {
    env?: NodeJS.ProcessEnv;
    platform?: NodeJS.Platform;
    homedir?: typeof os.homedir;
}
interface ResolveDefaultUserRegistryPathOptions extends ResolveUserDataRootOptions {
    fileExists?: (targetPath: string) => boolean;
    preferredRoot?: string;
    preferredPath?: string;
    legacyPath?: string;
    preferLegacyFallback?: boolean;
}
export declare const PACKAGE_NAME = "user-habit-pipeline";
export declare const USER_HOME_OVERRIDE_ENV = "USER_HABIT_PIPELINE_HOME";
export declare const LEGACY_DATA_DIR: string;
export declare const LEGACY_USER_REGISTRY_PATH: string;
export declare function resolveUserDataRoot(options?: ResolveUserDataRootOptions): string;
export declare function resolveDefaultUserRegistryPath(options?: ResolveDefaultUserRegistryPathOptions): string;
export {};
