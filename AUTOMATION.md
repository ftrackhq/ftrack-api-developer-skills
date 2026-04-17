# ftrack Automation Skills

Skills for automating ftrack development workflows.

## Overview

Automation skills streamline repetitive development tasks and integrate ftrack workflows with external tools like GitHub and Linear.

## Available Skills

### ftrack-create-pull-request

Automates GitHub pull request creation with Linear integration and org-specific PR templates.

#### Installation

```bash
/install ftrack-create-pull-request
```

#### What It Does

Automates the complete PR creation workflow:

1. **Gathers context** - Analyzes branch, commits, and diff
2. **Linear integration** - Finds or creates Linear ticket
3. **Branch management** - Pushes branch if unpushed
4. **Template fetching** - Fetches org PR template from GitHub
5. **PR creation** - Creates PR with proper template
6. **Linking** - Attaches PR URL to Linear ticket

#### Key Features

- Fetches org PR template from GitHub (not local files)
- Links Linear tickets automatically
- Creates Linear ticket if needed (with user confirmation)
- Pushes branch and opens PR in one command
- Attaches PR URL back to Linear for tracking
- Handles existing PRs gracefully

#### Prerequisites

**Required**:
- `gh` CLI authenticated with access to the ftrackhq GitHub org
- Linear MCP server connected to Claude Code
- Git repository with feature branch checked out

**Setup verification**:
```bash
# Check GitHub authentication
gh auth status

# Check Linear connection
# In Claude Code: "List my Linear issues"

# Check current branch
git branch --show-current
```

#### Usage

**Automatic invocation**:
```
"Create a pull request"
"Open a PR for this branch"
"I'm done with this feature"
```

**Manual invocation**:
```bash
/ftrack-create-pull-request
```

#### Workflow Example

```bash
# 1. Create and checkout feature branch
git checkout -b feat/new-feature

# 2. Make your changes and commit
git add .
git commit -m "Add new feature"

# 3. Create PR (invokes skill)
/ftrack-create-pull-request

# The skill will:
# - Check if branch is pushed (pushes if needed)
# - Find or create Linear ticket (asks for confirmation)
# - Fetch ftrackhq PR template from GitHub
# - Create PR with template filled out
# - Link PR to Linear ticket
# - Display PR URL
```

#### What Gets Automated

✅ **Automated**:
- Branch status check and push
- Linear ticket lookup/creation
- PR template fetching from GitHub
- PR creation with template
- PR-to-Linear linking
- Error handling and recovery

❌ **Not Automated** (requires user input):
- Linear ticket creation confirmation
- PR description review and edits
- Assignee and reviewer selection (can be added via `gh pr create` flags)

#### Template Handling

The skill **always fetches the latest PR template** from your GitHub org:

```bash
# Fetches from: https://github.com/ftrackhq/REPO/.github/pull_request_template.md
gh api repos/ftrackhq/REPO/contents/.github/pull_request_template.md
```

This ensures:
- ✅ Always uses current org template
- ✅ No stale local copies
- ✅ Consistent across all repos
- ✅ Template changes propagate automatically

#### Linear Integration

**Ticket lookup**:
```
Branch: feat/ENG-123-new-feature
  → Finds Linear ticket ENG-123
  → Links PR to ticket
```

**Ticket creation** (if no ticket found):
```
Branch: feat/new-feature
  → Asks: "No Linear ticket found. Create one?"
  → Creates: "New Feature" in default team
  → Links PR to new ticket
```

**PR linking**:
```
PR created: https://github.com/ftrackhq/repo/pull/456
  → Adds URL to Linear ticket description
  → Updates ticket status to "In Review"
```

#### Error Handling

The skill handles common scenarios:

| Scenario | Behavior |
|----------|----------|
| PR already exists | Shows existing PR URL, exits gracefully |
| Branch not pushed | Pushes branch with `-u origin` |
| No Linear ticket | Offers to create one (asks first) |
| GitHub auth issue | Shows `gh auth login` instructions |
| Linear not connected | Shows MCP connection instructions |
| Template not found | Uses default PR template |

#### Customization

**Override default behavior**:
```bash
# Create PR with custom title and reviewers
gh pr create --title "Custom Title" --reviewer user1,user2

# Create draft PR
gh pr create --draft

# Create PR with custom base branch
gh pr create --base develop
```

The skill uses `gh pr create` under the hood, so all `gh` flags work.

#### Troubleshooting

**Issue**: "gh: command not found"
```bash
# Install GitHub CLI
# macOS: brew install gh
# Windows: winget install GitHub.cli
# Linux: https://github.com/cli/cli#installation
```

**Issue**: "Not authenticated with GitHub"
```bash
gh auth login
```

**Issue**: "Linear MCP server not connected"
```bash
# In Claude Code settings, add Linear MCP server
# See: https://modelcontextprotocol.io/servers/linear
```

**Issue**: "No Linear ticket found"
- Ensure branch name contains Linear ticket ID (e.g., `feat/ENG-123-feature`)
- Or allow skill to create new ticket when prompted

**Issue**: "PR template not found"
- Skill falls back to default template
- Check if template exists at `.github/pull_request_template.md` in your repo

#### Advanced Usage

**Multi-repository workflow**:
```bash
# Create PRs across multiple repos
cd repo1 && /ftrack-create-pull-request
cd ../repo2 && /ftrack-create-pull-request
```

**Integration with other skills**:
```bash
# Review code, then create PR
/security-review
/ftrack-create-pull-request
```

#### Best Practices

1. **Branch naming**: Use Linear ticket IDs in branch names (`feat/ENG-123-description`)
2. **Commit messages**: Write clear, descriptive commits (used in PR description)
3. **Pre-PR checks**: Run tests and linting before creating PR
4. **Linear sync**: Keep Linear tickets updated with PR status
5. **Template usage**: Follow org PR template guidelines

#### Limitations

- Requires `gh` CLI (not git alone)
- Only works with GitHub (not GitLab, Bitbucket)
- Linear integration is optional but recommended
- PR template must be in `.github/` directory
- Only supports single-repo PRs (no cross-repo PRs)

#### Future Enhancements

Planned features:
- Auto-assign reviewers based on file changes
- Auto-label PRs based on commit patterns
- Slack notifications on PR creation
- Jira integration (alternative to Linear)
- Support for GitLab and Bitbucket

## Links

- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Linear MCP Server](https://modelcontextprotocol.io/servers/linear)
- [ftrack GitHub Organization](https://github.com/ftrackhq)
