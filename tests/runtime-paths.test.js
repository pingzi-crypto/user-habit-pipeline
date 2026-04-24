const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  LEGACY_USER_REGISTRY_PATH,
  USER_HOME_OVERRIDE_ENV,
  resolveDefaultUserRegistryPath,
  resolveUserDataRoot
} = require("../src/runtime_paths");
const packageExports = require("../src");

test("resolveUserDataRoot prefers explicit override", () => {
  const root = resolveUserDataRoot({
    env: {
      [USER_HOME_OVERRIDE_ENV]: "D:\\custom-uhp-home"
    },
    platform: "win32"
  });

  assert.equal(root, path.resolve("D:\\custom-uhp-home"));
});

test("resolveUserDataRoot derives a Windows AppData path", () => {
  const root = resolveUserDataRoot({
    env: {
      APPDATA: "C:\\Users\\pz\\AppData\\Roaming"
    },
    platform: "win32"
  });

  assert.equal(root, path.join("C:\\Users\\pz\\AppData\\Roaming", "user-habit-pipeline"));
});

test("resolveUserDataRoot derives an XDG config path on non-Windows systems", () => {
  const root = resolveUserDataRoot({
    env: {
      XDG_CONFIG_HOME: "/home/pz/.config"
    },
    platform: "linux",
    homedir: () => "/home/pz"
  });

  assert.equal(root, path.join("/home/pz/.config", "user-habit-pipeline"));
});

test("resolveDefaultUserRegistryPath falls back to the legacy repo file only when the new path does not exist yet", () => {
  const preferredPath = path.join("C:\\Users\\pz\\AppData\\Roaming", "user-habit-pipeline", "user_habits.json");
  const resolved = resolveDefaultUserRegistryPath({
    preferredPath,
    legacyPath: LEGACY_USER_REGISTRY_PATH,
    fileExists: (targetPath) => targetPath === LEGACY_USER_REGISTRY_PATH
  });

  assert.equal(resolved, LEGACY_USER_REGISTRY_PATH);
});

test("resolveDefaultUserRegistryPath prefers the user data path once it exists", () => {
  const preferredPath = path.join("C:\\Users\\pz\\AppData\\Roaming", "user-habit-pipeline", "user_habits.json");
  const resolved = resolveDefaultUserRegistryPath({
    preferredPath,
    legacyPath: LEGACY_USER_REGISTRY_PATH,
    fileExists: (targetPath) => targetPath === preferredPath || targetPath === LEGACY_USER_REGISTRY_PATH
  });

  assert.equal(resolved, preferredPath);
});

test("resolveDefaultUserRegistryPath respects explicit override even when the legacy file exists", () => {
  const preferredPath = path.join("D:\\custom-uhp-home", "user_habits.json");
  const resolved = resolveDefaultUserRegistryPath({
    env: {
      [USER_HOME_OVERRIDE_ENV]: "D:\\custom-uhp-home"
    },
    preferredPath,
    legacyPath: LEGACY_USER_REGISTRY_PATH,
    fileExists: (targetPath) => targetPath === LEGACY_USER_REGISTRY_PATH
  });

  assert.equal(resolved, preferredPath);
});

test("package entrypoint re-exports runtime path helpers and constants", () => {
  assert.equal(packageExports.PACKAGE_NAME, "user-habit-pipeline");
  assert.equal(packageExports.USER_HOME_OVERRIDE_ENV, USER_HOME_OVERRIDE_ENV);
  assert.equal(typeof packageExports.resolveUserDataRoot, "function");
  assert.equal(typeof packageExports.resolveDefaultUserRegistryPath, "function");
});
