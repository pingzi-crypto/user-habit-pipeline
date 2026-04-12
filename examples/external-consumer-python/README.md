# External Consumer Python Template

This folder is a copyable starting point for Python projects that want to consume `user-habit-pipeline` without re-implementing the interpretation rules.

It covers two realistic paths:

- `cli-demo.py` for the lowest-friction JSON subprocess boundary
- `http-client-demo.py` for projects that prefer a localhost HTTP contract

## Recommended Use

Use `cli-demo.py` when:

- your host is Python
- you want the simplest stable boundary
- you are comfortable invoking the installed package through `npm exec`

Use `http-client-demo.py` when:

- your host prefers an API-shaped localhost boundary
- you want to keep interpretation out of the Python process
- another part of your system is already starting `user-habit-pipeline-http`

## Install In The Target Project

From the target project root:

```powershell
npm install user-habit-pipeline
```

The scripts assume they are run from a project root where that package is already installed.

## Files

- `cli-demo.py`
- `http-client-demo.py`

## Suggested Flow

1. Copy the script you want into your Python project.
2. Keep `user-habit-pipeline` installed in the same project root.
3. Replace the sample message, scenario, request, or port with your own host values.
