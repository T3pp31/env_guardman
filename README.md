# Env Guardman

A VS Code extension that automatically detects differences between `.env.example` and `.env`, notifying you of missing environment variables and helping you add them interactively.

Everything runs locally — no secrets are ever sent over the network.

## The Problem

In team development, someone adds a new variable to `.env.example`, you pull the latest code, and your app breaks with a cryptic error — all because you didn't notice the missing env var. Env Guardman prevents this.

## Features

- **Auto Diff Check** — Automatically compares `.env.example` and `.env` when the workspace opens, a Git branch is switched, or a file is saved
- **Warning Notification** — Shows a warning popup when missing variables are detected
- **Interactive Input** — Click "Add Now" to fill in missing variables one by one via InputBox and append them to `.env`
- **Status Bar** — Always shows `.env OK` or `.env: N missing` at a glance
- **Command Palette** — Manually run checks or add missing variables anytime
- **Fully Local** — Zero network requests, your secrets stay safe

## Usage

1. Open a project containing `.env.example` in VS Code
2. The diff check runs automatically
3. If any variables are missing, a warning notification appears
4. Click "Add Now" to enter the values

### Commands

| Command | Description |
|---------|-------------|
| `Env Guardman: Check Missing Variables` | Manually run a diff check |
| `Env Guardman: Add Missing Variables` | Launch the input wizard for missing variables |

## Settings

Customize the behavior in VS Code settings (`settings.json`).

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `envGuardman.templateFile` | `string` | `.env.example` | Path to the template env file (relative to workspace root) |
| `envGuardman.envFile` | `string` | `.env` | Path to the actual env file (relative to workspace root) |
| `envGuardman.ignorePatterns` | `string[]` | `[]` | Regex patterns for variable names to ignore |
| `envGuardman.checkOnOpen` | `boolean` | `true` | Run check when the workspace is opened |
| `envGuardman.checkOnBranchSwitch` | `boolean` | `true` | Run check when a Git branch is switched |
| `envGuardman.checkOnSave` | `boolean` | `true` | Run check when `.env` or `.env.example` is saved |

### Example

```jsonc
{
  // Ignore variables starting with OPTIONAL_
  "envGuardman.ignorePatterns": ["^OPTIONAL_"],
  // Disable check on branch switch
  "envGuardman.checkOnBranchSwitch": false
}
```

## Supported .env Format

```bash
# Comment lines (ignored)
KEY=value
EMPTY_KEY=
KEY_ONLY
QUOTED="hello world"
SINGLE_QUOTED='hello world'
INLINE_COMMENT=value # inline comments are stripped
URL=postgres://host:5432/db?opt=1  # = inside values is preserved
```

## Privacy & Security

- Makes zero network requests
- `.env` values are never included in logs or telemetry
- All processing happens locally within VS Code

## Contributing

Bug reports and feature requests are welcome on [GitHub Issues](https://github.com/T3pp31/env_guardman/issues).

To contribute code, see [CONTRIBUTING.md](https://github.com/T3pp31/env_guardman/blob/master/CONTRIBUTING.md).

## License

MIT
