# Cross-Repo Release Runbook

Use this runbook when you want to cut the current `user-habit-pipeline` and `manage-current-session-habits` release set as one outward-facing Codex flow.

This is the practical execution order.
For deeper validation rules, keep [cross-repo-release-checklist.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/cross-repo-release-checklist.md) as the source checklist.

---

## Target Release Set

- backend repo: `user-habit-pipeline v0.4.2`
- skill repo: `manage-current-session-habits v0.3.0`

Recommended release order:

1. release the backend first
2. release the skill second

Reason:

- the skill is a thin integration layer on top of the backend contract
- the backend version should be the reference point the skill release is validated against

---

## 1. Preflight

Confirm both repositories:

- are on the intended branch
- have no uncommitted work
- already contain the release-facing docs you want to ship

Current release-facing source files:

- backend notes: [release-notes-v0.4.2.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/release-notes-v0.4.2.md)
- backend changelog: [CHANGELOG.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/CHANGELOG.md)
- skill notes: [RELEASE-NOTES-v0.3.0.md](https://github.com/pingzi-crypto/manage-current-session-habits/blob/main/RELEASE-NOTES-v0.3.0.md)
- skill README demo asset: [readme-short-demo.gif](https://github.com/pingzi-crypto/manage-current-session-habits/blob/main/assets/readme-short-demo.gif)

For the skill release body:

- use [RELEASE-NOTES-v0.3.0.md](https://github.com/pingzi-crypto/manage-current-session-habits/blob/main/RELEASE-NOTES-v0.3.0.md) as the primary release body
- keep the README demo asset attached if the release page should mirror the README

---

## 2. Backend Validation

Run from [user-habit-pipeline](https://github.com/pingzi-crypto/user-habit-pipeline):

```powershell
npm run release-check
```

Release only if `npm run release-check` passes.
It already includes:

- test suite
- manual E2E smoke
- package smoke
- package install smoke
- registry validation

Before moving on, confirm:

- [package.json](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/package.json) says `0.4.2`
- [CHANGELOG.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/CHANGELOG.md) has a `0.4.2 - 2026-04-07` section
- [release-notes-v0.4.2.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/release-notes-v0.4.2.md) matches what you want to publish

---

## 3. Skill Validation Against That Backend

Run from [manage-current-session-habits](https://github.com/pingzi-crypto/manage-current-session-habits):

```powershell
& .\scripts\install-skill.ps1 -CheckOnly
& .\scripts\check-install.ps1 -SmokeTest
```

If local-checkout compatibility is part of the release promise, also run:

```powershell
& .\scripts\install-skill.ps1 -BackendRepoPath <path-to-user-habit-pipeline> -CheckOnly
```

Before moving on, confirm:

- [README.md](https://github.com/pingzi-crypto/manage-current-session-habits/blob/main/README.md) is the public install surface you want users to see
- [SKILL.md](https://github.com/pingzi-crypto/manage-current-session-habits/blob/main/SKILL.md) still matches the backend bridge behavior
- the README demo GIF is the one you want on the release page

---

## 4. Create The Backend Release

Recommended tag:

- `v0.4.2`

Suggested commands:

```powershell
git tag v0.4.2
git push origin v0.4.2
```

On GitHub:

1. open the `user-habit-pipeline` releases page
2. create a new release from tag `v0.4.2`
3. use [release-notes-v0.4.2.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/release-notes-v0.4.2.md) as the release body

Recommended title:

- `user-habit-pipeline v0.4.2`

---

## 5. Create The Skill Release

Recommended tag:

- `v0.3.0`

Suggested commands:

```powershell
git tag v0.3.0
git push origin v0.3.0
```

On GitHub:

1. open the `manage-current-session-habits` releases page
2. create a new release from tag `v0.3.0`
3. use [RELEASE-NOTES-v0.3.0.md](https://github.com/pingzi-crypto/manage-current-session-habits/blob/main/RELEASE-NOTES-v0.3.0.md) as the release body
4. attach or embed [readme-short-demo.gif](https://github.com/pingzi-crypto/manage-current-session-habits/blob/main/assets/readme-short-demo.gif) if the release page should mirror the README demo

Recommended title:

- `manage-current-session-habits v0.3.0`

---

## 6. Post-Release Checks

After both releases are live, confirm:

- the backend release page points at the right `v0.4.2` notes
- the skill release page points at the right `v0.3.0` body and demo asset
- the skill README install commands still work against the released backend checkout
- the contract wording between backend docs and skill docs still matches

---

## 7. If You Only Have Time For One Public Release

If you want the smallest outward-facing move today, publish the skill release first only if:

- the backend repository state is already pushed and validated
- you are comfortable treating backend `v0.4.2` as the contract baseline even if its GitHub release page is created slightly later

Default recommendation:

- do not split the pair unless time is tight
- release backend `v0.4.2` and skill `v0.3.0` in the same session
