# Git Workflow & Commit Guidelines

## Branch Structure

The project follows a simple branching strategy:

* **`master`** — Stable, production-ready branch. This branch should always be deployable.
* **`preview`** — Main development branch. New features and ongoing development are merged here first for testing and validation.
* **Temporary branches** — Feature, bugfix, or task-specific branches created during development. These branches are short-lived and should be deleted after being merged.

### Development Flow

```text
temporary branch
        │
        ▼
    preview
        │
        ▼
     master
```

* Create a temporary branch from `preview`.
* Complete your work in the temporary branch.
* Open a Pull Request (PR) and merge it into `preview`.
* After testing and verification, merge `preview` into `master`.
* `master` should always remain in a deployable state.

---

# Commit Structure

Every commit must follow this format:

```text
type: short description
```

## Commit Types

| Type       | Usage                                            |
| ---------- | ------------------------------------------------ |
| `feat`     | add a new feature                                |
| `fix`      | fix a bug                                        |
| `refactor` | improve code structure without changing behavior |
| `chore`    | maintenance, configuration, dependency updates   |
| `style`    | ui/css or formatting changes (no logic changes)  |
| `docs`     | documentation updates                            |
| `test`     | add or update tests                              |
| `perf`     | performance improvements                         |
| `hotfix`   | urgent production fix                            |

## Examples

```text
feat: add order approval workflow
fix: resolve duplicate print request
refactor: simplify auth middleware
chore: update dependencies
style: improve dashboard layout
docs: update api documentation
test: add order service unit tests
hotfix: fix production login issue
```

## Commit Guidelines (Strict Lowercase Only)

* **Strictly use lowercase letters only**: No uppercase letters are allowed anywhere in commit messages (e.g. `type: description`).
* Keep descriptions **short and descriptive**.
* One commit should represent **one logical change**.
* Avoid vague messages such as `fix: changes` or `chore: update`.
* Pull the latest changes before starting work.
* Merge changes through Pull Requests whenever possible.
