# Release Notes: v0.6.0

`user-habit-pipeline` `v0.6.0` expands the package from a base shorthand interpreter into a more complete local integration kit for real projects.

This release makes two paths materially easier:

- calling the pipeline from another local app through an official localhost HTTP surface
- starting and distributing a project-specific habit registry without hand-copying example files

## Highlights

- Added the official `user-habit-pipeline-http` CLI as a supported localhost integration entrypoint.
- Added built-in HTTP routes for `/health`, `/interpret`, `/suggest`, and `/manage`.
- Added official Python and PowerShell HTTP client examples for local consumer projects.
- Added a packaged project-registry starter template under `examples/project-registry/`.
- Added `user-habit-pipeline-init-registry` so consumers can scaffold a custom registry directory from the installed package.
- Expanded package-install smoke coverage so published tarballs are validated against the HTTP surface and packaged project-registry starter flow.

## Why This Release Exists

Before `v0.6.0`, consumers could use the interpreter, but project-level adoption still had friction:

- localhost-style integration was possible but not fully positioned as a first-class package surface
- custom registry bootstrapping still depended too much on reading docs and copying files manually

`v0.6.0` closes that gap by making local integration and project-specific authoring both more explicit and more productized.

## Upgrade Notes

Existing CLI and library consumers do not need code changes for previously supported flows.

New optional entrypoints:

```powershell
npx user-habit-pipeline-http --port 4848
npx user-habit-pipeline-init-registry --out .\my-project-registry
```

## Validation

Release validation for this version includes:

- full `npm run release-check`
- tarball install smoke for installed bin shims
- localhost HTTP route validation
- packaged registry starter validation
