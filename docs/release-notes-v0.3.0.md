# Release Notes: v0.3.0

Released on `2026-04-01`.

## Summary

`v0.3.0` expands the user-managed habit overlay from basic add/remove/list support into a more portable and self-service management flow.

The release keeps the project boundary unchanged:

- this project still interprets shorthand expressions into structured intent hints
- this project still does not execute downstream workflow actions

## Highlights

- Added export support for the user habit overlay so customizations can be backed up or moved between environments.
- Added import support for user overlay state with `replace` and `merge` modes.
- Expanded lightweight prompt parsing so users can trigger habit management with more natural Chinese phrasing.
- Added support for multiline add requests in prompt form, which makes lightweight management easier from plain text prompts.
- Updated CLI help, API exports, regression tests, and management documentation to cover the expanded workflow.

## Example Commands

Export the current user overlay:

```powershell
npm run manage-habits -- --export .\backup\user_habits.json
```

Import and replace the current overlay:

```powershell
npm run manage-habits -- --import .\backup\user_habits.json
```

Import and merge with the current overlay:

```powershell
npm run manage-habits -- --import .\backup\user_habits.json --mode merge
```

Prompt-style export:

```powershell
npm run manage-habits -- --request "导出用户习惯短句: path=.\backup\user_habits.json"
```

Prompt-style import:

```powershell
npm run manage-habits -- --request "导入习惯短句 路径=.\backup\user_habits.json; 模式=merge"
```

Multiline prompt-style add:

```powershell
npm run manage-habits -- --request "新增习惯短句 phrase=收尾一下
intent=close_session
场景=session_close
置信度=0.86"
```

## Validation

This release was verified with:

- `npm test`
- `npm run release-check`

## Related Docs

- [CHANGELOG.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/CHANGELOG.md)
- [user-habit-management.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/user-habit-management.md)
- [api-reference.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/api-reference.md)
