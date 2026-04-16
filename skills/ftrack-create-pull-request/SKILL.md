---
name: ftrack-create-pull-request
description: >
  Use when the user wants to create a pull request for the current branch, or
  when finishing work on a feature branch. Checks for an existing PR, ensures a
  Linear ticket exists (asks before creating), fetches the org PR template fresh
  from GitHub, and links everything together. Use when the user says "create a
  PR", "open a pull request", "I'm done with this branch", or
  "/ftrack-create-pull-request".
metadata:
  author: ftrack
  version: 0.1.0
---

# Create Pull Request

Create a GitHub pull request for the current branch with the org PR template and a linked Linear ticket.

## Overview

The core workflow:

1. **Gather context** — branch, commits, diff, existing PRs
2. **Find or create a Linear ticket** — search for a match, or offer to create one
3. **Push the branch** — if there are unpushed commits
4. **Fetch the org PR template** — always fresh from GitHub, never hardcoded
5. **Create the PR** — fill in the template and open it
6. **Link the PR to Linear** — attach the URL to the ticket

## Prerequisites

The following tools must be available:

- `gh` CLI — authenticated with access to the GitHub org
- `git` — with the repo cloned and a feature branch checked out
- Linear MCP server — connected for ticket search and creation

## Abort conditions

- If the current branch is `main` — tell the user to create a feature branch first and stop.
- If a PR already exists for this branch — show the URL and stop (unless user asks to update it).

## Workflow

### Step 1: Gather context

Run these commands to understand the current state:

```bash
git branch --show-current
git log main..HEAD --oneline
git diff main --stat
gh pr list --head <branch> --json number,url,title
git log origin/<branch>..HEAD --oneline 2>/dev/null
```

Check the abort conditions before proceeding.

### Step 2: Find or create a Linear ticket

Search Linear for an issue matching the branch name or work description:

```
mcp__linear-server__list_issues(team: "ftrack", query: "<branch name or keywords>")
```

**If a matching ticket is found:** confirm with the user that this is the right one.

**If no ticket is found:** ask the user:

> No Linear ticket found for this work. Want me to create one?
> - Title: `<suggested title based on commits>`
> - Team: ftrack

Wait for the user's response. If they approve, create the ticket:

```
mcp__linear-server__save_issue(team: "ftrack", title: "<title>", description: "<description from commits>", assignee: "me")
```

Use the Linear issue identifier (e.g., `F-1234`) in the PR body.

### Step 3: Push the branch

If there are unpushed commits:

```bash
git push -u origin <branch>
```

### Step 4: Fetch the org PR template

**Always fetch the fresh template** from the org `.github` repo. Never use a hardcoded copy — the template may change.

```bash
gh api repos/ftrackhq/.github/contents/.github/pull_request_template.md --jq '.content' | base64 -d
```

### Step 5: Create the PR

Fill in the fetched template based on the commits and diff, then create the PR:

```bash
gh pr create --title "<title>" --body "<filled-in template>"
```

#### PR title guidelines

- Keep under 70 characters
- Use conventional commit prefix: `feat:`, `fix:`, `perf:`, `chore:`, `refactor:`, `docs:`, `test:`
- Describe the **what**, not the how

#### Filling in the template

- **Resolves**: Use the Linear identifier (e.g., `Resolves F-1234`). Link format: `[F-1234](https://linear.app/ftrack/issue/F-1234/)`
- **Checklist**: Check the boxes that apply based on what the diff contains
- **Changes**: Summarize from the commit messages and diff. Be specific — what changed and why.
- **Test**: Describe how to verify the changes work. For bug fixes, include the original reproduction steps.

### Step 6: Link the PR to the Linear ticket

After creating the PR, attach the PR URL to the Linear issue:

```
mcp__linear-server__save_issue(id: "<issue id>", links: [{url: "<pr url>", title: "Pull Request"}])
```

### Step 7: Report

Show the user:

- PR URL
- Linear ticket identifier and URL
- Summary of what was included

## Common mistakes

1. **Hardcoding the PR template** — The org template lives in `ftrackhq/.github` and may change. Always fetch it fresh via the GitHub API.
2. **Skipping the Linear search** — Even if the branch name doesn't look like a ticket, search anyway. The user may have named it differently.
3. **Creating a ticket without asking** — Always confirm with the user before creating a new Linear ticket. They may already have one elsewhere.
4. **Forgetting to push** — The PR can't be created if the branch isn't on the remote.
5. **Not linking back to Linear** — The PR and ticket should reference each other for traceability.
