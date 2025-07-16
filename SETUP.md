# Monorepo Setup Guide

This guide explains how to set up, develop, test, and deploy this dynamic widget monorepo.

## 🎯 Overview

This monorepo demonstrates:
- Dynamic code generation from JSON to TypeScript packages
- Full type safety with TypeScript
- Automated testing with >80% coverage requirement
- npm package publishing automation
- CI/CD with GitHub Actions and Release Please

## 📋 Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (`npm install -g pnpm@8.12.0`)
- Git
- GitHub account (for CI/CD)
- npm account (for publishing)

## 🚀 Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd npm-test

# Install dependencies
pnpm install

# Generate packages from input.json
pnpm run codegen

# Build all packages
pnpm run build

# Run tests with coverage
pnpm run test:coverage
```

### 2. Verify Setup

```bash
# Check project status
pnpm run summary
```

This will show:
- ✅ All packages generated
- ✅ Tests passing with 100% coverage
- ✅ Build artifacts created
- ✅ Configuration files in place

## 📁 Project Structure

```
npm-test/
├── codegen/                    # Code generation tool
│   ├── src/
│   │   └── index.ts           # Generates packages from JSON
│   └── input.json             # Source JSON data
├── packages/                   # Generated packages (git-ignored)
│   ├── widget/                # Main widget implementation
│   └── widget-types/          # TypeScript type definitions
├── tests/                      # Test setup
├── scripts/                    # Utility scripts
├── .github/workflows/          # GitHub Actions
│   └── ci-cd.yml             # CI/CD pipeline
└── Configuration files
```

## 🔧 Development Workflow

### 1. Modifying Input JSON

Edit `codegen/input.json` with your data structure:

```json
{
  "widget": {
    "window": {
      "title": "My Widget",
      "width": 800,
      "height": 600
    }
  }
}
```

### 2. Regenerate Packages

```bash
# Regenerate packages from updated JSON
pnpm run codegen

# The following packages will be generated:
# - @monorepo/widget - Widget class with get/set methods
# - @monorepo/widget-types - Full TypeScript types
```

### 3. Run Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode for development
pnpm test:watch
```

### 4. Build Packages

```bash
# Build all packages
pnpm run build

# Clean and rebuild
pnpm run clean && pnpm run build
```

## 📦 Using the Generated Packages

### Widget Package

```typescript
import { Widget } from '@monorepo/widget';
import type { WidgetData } from '@monorepo/widget-types';

// Create widget from JSON
const data: WidgetData = { /* your data */ };
const widget = Widget.fromJSON(data);

// Type-safe access
const title = widget.get('widget.window.title'); // string
const width = widget.get('widget.window.width'); // number

// Update values
widget.set('widget.window.title', 'New Title');

// Check existence
if (widget.has('widget.window')) {
  // Path exists
}

// Get all data
const allData = widget.getData();
```

### Type Safety

The generated types provide full IntelliSense:
- Autocomplete for all valid paths
- Type checking for values
- Compile-time error detection

## 🚀 GitHub Actions Setup

### 1. Create GitHub Repository

```bash
git init
git add .
git commit -m "feat: initial monorepo setup"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Configure GitHub Secrets

Go to Settings → Secrets and variables → Actions:

| Secret | Description | Required |
|--------|-------------|----------|
| `NPM_TOKEN` | npm authentication token | Yes |
| `INPUT_JSON_URL` | URL to download input.json | No |

### 3. Get npm Token

```bash
# Login to npm
npm login

# Create automation token
npm token create --read-only=false
```

Copy the token and add it as `NPM_TOKEN` secret in GitHub.

## 🔄 CI/CD Pipeline

### Automatic Workflow

The CI/CD pipeline runs automatically on:
- Push to `main` branch
- Pull requests
- Manual trigger via GitHub Actions UI

### Pipeline Jobs

1. **Test & Build** - Runs on Node 18.x and 20.x
   - Downloads input.json (if URL provided)
   - Generates packages
   - Runs linting and type checking
   - Runs tests with coverage check (>80%)
   - Builds all packages

2. **Release Please** - Manages releases
   - Creates/updates release PR
   - Bumps versions
   - Updates changelogs
   - Publishes to npm when merged

3. **Deploy Dry Run** - On PRs
   - Validates packages can be published
   - No actual deployment

4. **Generate from URL** - Manual trigger
   - Downloads input.json from custom URL
   - Generates and tests packages

### Manual Workflow Trigger

1. Go to Actions tab in GitHub
2. Select "CI/CD" workflow
3. Click "Run workflow"
4. (Optional) Enter input.json URL
5. Click "Run workflow"

## 📝 Release Process

### Conventional Commits

Use conventional commit messages:

```bash
feat: add new widget property        # Minor version bump
fix: resolve type error             # Patch version bump
feat!: breaking change in API       # Major version bump
docs: update README                 # No version bump
chore: update dependencies          # No version bump
```

### Release Flow

1. Make changes and commit with conventional commits
2. Push to main branch
3. Release Please creates/updates a PR
4. Review and merge the release PR
5. Packages are automatically published to npm

### Manual Release

If needed, you can publish manually:

```bash
# Build everything first
pnpm run build

# Publish widget-types first
cd packages/widget-types
npm publish --access public

# Then publish widget
cd ../widget
npm publish --access public
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Coverage Failing
```bash
# Check coverage report
pnpm test:coverage

# Look for uncovered lines in:
cat coverage/lcov-report/index.html
```

#### 2. Build Errors
```bash
# Clean everything
pnpm run clean
rm -rf node_modules packages/*/node_modules

# Reinstall and rebuild
pnpm install
pnpm run codegen
pnpm run build
```

#### 3. Type Errors
```bash
# Check TypeScript errors
pnpm run typecheck

# Regenerate packages if input.json changed
pnpm run codegen
```

#### 4. Publishing Issues

- Ensure NPM_TOKEN is set correctly
- Check package names are unique on npm
- Verify you have publish permissions

### Debug Commands

```bash
# Check workspace structure
pnpm ls -r

# Test npm publishing (dry run)
cd packages/widget-types && npm pack --dry-run
cd packages/widget && npm pack --dry-run

# Check generated types
cat packages/widget-types/src/index.ts

# Run specific package scripts
pnpm --filter @monorepo/widget run build
```

## 🛠️ Customization

### Adding New Properties to JSON

1. Update `codegen/input.json`
2. Run `pnpm run codegen`
3. Update tests if needed
4. Commit with conventional commit message

### Modifying Code Generation

Edit `codegen/src/index.ts` to:
- Change generated class methods
- Modify type generation logic
- Update package configurations

### Adding New Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    "your-script": "your command"
  }
}
```

## 📚 Additional Resources

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Vitest Documentation](https://vitest.dev/)
- [Release Please](https://github.com/googleapis/release-please)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Actions](https://docs.github.com/en/actions)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure coverage remains >80%
5. Submit PR with conventional commit messages

## 📄 License

MIT