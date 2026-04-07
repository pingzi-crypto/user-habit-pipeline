# Release Checklist

Use this checklist before cutting a package or internal milestone from this repository.

## Product Checks

- Confirm [mvp-spec.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/mvp-spec.md) still matches the shipped runtime behavior.
- Confirm [examples.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/examples.md) still reflects the current fixture source.
- Confirm [registry-authoring.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/registry-authoring.md) still matches the runtime validator and schema.
- Run the critical path in [manual-e2e-acceptance.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/manual-e2e-acceptance.md) when the bridge, skill-facing output, or user overlay flow changed.
- If the Codex bridge request/response shape changed, update [codex-current-session-contract.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/codex-current-session-contract.md) in the same change set.
- If the release needs to hold together with the Codex skill repo, also run [cross-repo-release-checklist.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/cross-repo-release-checklist.md).
- If low-ROI stop behavior changed, confirm the one-word stop path still works in the E2E smoke flow.

## Validation Commands

Run these commands from the repository root:

```powershell
npm run manual-e2e-smoke
npm run release-check
```

If you changed example fixtures, also run:

```powershell
npm run generate-examples-doc
```

## Packaging Checks

- Confirm [package.json](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/package.json) version and metadata are correct for the release.
- Confirm `npm whoami` succeeds on the publishing machine before starting the final publish step.
- Confirm exported files are intentional and no unnecessary test fixtures are included in the package.
- Confirm `npm run package-install-smoke` passes so a real tarball install, installed bin shims, and runtime user-data path behavior have all been exercised before publish.
- Confirm CLI entrypoints still work:
  - `npm run interpret -- --message "验收" --scenario reviewer`
  - `npm run validate-registry -- .\src\habit_registry\default_habits.json`

## Registry Checks

- Validate the default registry file.
- Validate any new registry fixtures or project-specific registries added for this release.
- Check that ambiguous phrases still stay conservative.

## Documentation Checks

- Update [CHANGELOG.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/CHANGELOG.md) with release-specific notes.
- Update [README.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/README.md) if CLI or library usage changed.
- Update [editor-integration.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/editor-integration.md) if schema mapping patterns changed.
