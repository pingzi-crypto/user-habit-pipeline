# Release Checklist

Use this checklist before cutting a package or internal milestone from this repository.

## Product Checks

- Confirm [mvp-spec.md](/E:/user-habit-pipeline/docs/mvp-spec.md) still matches the shipped runtime behavior.
- Confirm [examples.md](/E:/user-habit-pipeline/docs/examples.md) still reflects the current fixture source.
- Confirm [registry-authoring.md](/E:/user-habit-pipeline/docs/registry-authoring.md) still matches the runtime validator and schema.
- Run the critical path in [manual-e2e-acceptance.md](/E:/user-habit-pipeline/docs/manual-e2e-acceptance.md) when the bridge, skill-facing output, or user overlay flow changed.
- If the Codex bridge request/response shape changed, update [codex-current-session-contract.md](/E:/user-habit-pipeline/docs/codex-current-session-contract.md) in the same change set.
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

- Confirm [package.json](/E:/user-habit-pipeline/package.json) version and metadata are correct for the release.
- Confirm exported files are intentional and no unnecessary test fixtures are included in the package.
- Confirm CLI entrypoints still work:
  - `npm run interpret -- --message "验收" --scenario reviewer`
  - `npm run validate-registry -- .\src\habit_registry\default_habits.json`

## Registry Checks

- Validate the default registry file.
- Validate any new registry fixtures or project-specific registries added for this release.
- Check that ambiguous phrases still stay conservative.

## Documentation Checks

- Update [CHANGELOG.md](/E:/user-habit-pipeline/CHANGELOG.md) with release-specific notes.
- Update [README.md](/E:/user-habit-pipeline/README.md) if CLI or library usage changed.
- Update [editor-integration.md](/E:/user-habit-pipeline/docs/editor-integration.md) if schema mapping patterns changed.
