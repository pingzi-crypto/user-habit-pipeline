# Cross-Repo Release Checklist

Use this checklist when `user-habit-pipeline` and `manage-current-session-habits` need to be validated together as one Codex-facing flow.

This is not a replacement for each repository's own release checklist.
It is the coordination layer that makes sure the backend package and the Codex skill still agree on the same bridge contract.

---

## 1. Backend First

Run from [user-habit-pipeline](/E:/user-habit-pipeline):

```powershell
npm run release-check
```

If the bridge, skill-facing output, or low-ROI stop behavior changed, also run:

```powershell
npm run manual-e2e-smoke
```

Confirm:

- the backend package still passes release validation
- the Codex bridge still returns the expected contract fields
- [codex-current-session-contract.md](/E:/user-habit-pipeline/docs/codex-current-session-contract.md) matches the shipped bridge behavior

---

## 2. Skill Install Resolution

Run from [manage-current-session-habits](/E:/manage-current-session-habits):

```powershell
& .\scripts\install-skill.ps1 -BackendRepoPath <path-to-user-habit-pipeline> -CheckOnly
```

Confirm:

- the backend repo resolves to the intended checkout
- the installed skill link target is correct
- no machine-specific path is being treated as a public contract requirement

---

## 3. Skill Smoke Against The Real Backend

Run from [manage-current-session-habits](/E:/manage-current-session-habits):

```powershell
& .\scripts\check-install.ps1 -SmokeTest
```

Confirm:

- wrapper `list` succeeds
- wrapper current-session `scan` succeeds
- the scan reply contains:
  - `assistant_reply_markdown`
  - `suggested_follow_ups`
  - `next_step_assessment`

---

## 4. Contract Alignment

Check that these documents still agree:

- [codex-current-session-contract.md](/E:/user-habit-pipeline/docs/codex-current-session-contract.md)
- [codex-skill-integration.md](/E:/user-habit-pipeline/docs/codex-skill-integration.md)
- [SKILL.md](/E:/manage-current-session-habits/SKILL.md)
- [README.md](/E:/manage-current-session-habits/README.md)

Pay special attention to:

- transcript sourcing rules
- thread input requirements
- chat-ready response fields
- low-ROI stop handling
- bridge error boundaries

---

## 5. Before Sharing Or Publishing

Before treating the pair as shareable or marketplace-ready:

- run the backend checklist in [release-checklist.md](/E:/user-habit-pipeline/docs/release-checklist.md)
- run the skill install preview and smoke commands from this checklist
- confirm both repositories are on the intended commits
- confirm the skill README and `SKILL.md` still point to the same backend contract behavior the backend actually ships
