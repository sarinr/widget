# Dynamic Widget Monorepo

A pnpm monorepo that dynamically generates TypeScript packages from JSON input with full type safety, automated testing, and npm deployment via GitHub Actions.

## 🏗️ Architecture

This monorepo consists of:

- **`codegen/`** - Code generation tool that converts JSON to TypeScript packages
- **`packages/widget/`** - Core widget class for accessing JSON data (auto-generated)
- **`packages/widget-types/`** - TypeScript type definitions (auto-generated)
- **GitHub Actions** - CI/CD pipeline with automated testing and npm publishing

## 📋 Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## 🚀 Quick Start

```bash
# Install pnpm globally
npm install -g pnpm@8.12.0

# Clone the repository
git clone <your-repo-url>
cd npm-test

# Install dependencies
pnpm install

# Run code generation
pnpm run codegen

# Run tests with coverage
pnpm run test:coverage

# Build all packages
pnpm run build
```

## 📁 Project Structure

```
npm-test/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # CI/CD pipeline
├── codegen/
│   ├── src/
│   │   └── index.ts          # Code generation logic
│   ├── input.json            # Source JSON data
│   └── package.json
├── packages/
│   ├── widget/               # Auto-generated widget package
│   └── widget-types/         # Auto-generated types package
├── tests/
│   └── setup.ts             # Test configuration
├── pnpm-workspace.yaml      # pnpm workspace config
├── vitest.config.ts         # Test runner config
├── release-please-config.json
└── package.json
```

## 🔧 Development

### Code Generation

The codegen script reads `codegen/input.json` and generates two packages:

```bash
# Generate packages from input.json
pnpm run codegen
```

This creates:
- `@monorepo/widget` - Widget class with `get()`, `set()`, `has()` methods
- `@monorepo/widget-types` - TypeScript types with full type safety

### Available Scripts

```bash
# Root level scripts
pnpm run codegen        # Generate packages from input.json
pnpm run build         # Build all packages
pnpm run test          # Run tests
pnpm run test:watch    # Run tests in watch mode
pnpm run test:coverage # Run tests with coverage report
pnpm run lint          # Run ESLint
pnpm run typecheck     # Run TypeScript type checking
pnpm run clean         # Clean all build artifacts
```

### Testing

Tests are written using Vitest and located in `__tests__` directories:

```bash
# Run all tests
pnpm test

# Run with coverage (minimum 80% required)
pnpm test:coverage

# Watch mode for development
pnpm test:watch
```

Coverage requirements:
- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

## 🔑 Type Safety

The generated types provide full IntelliSense support:

```typescript
import { Widget } from '@monorepo/widget';
import type { WidgetData } from '@monorepo/widget-types';

const data: WidgetData = {
  widget: {
    window: {
      title: "My Widget",
      width: 500
    }
  }
};

const widget = Widget.fromJSON(data);

// Type-safe access
const title = widget.get('widget.window.title'); // string
const width = widget.get('widget.window.width'); // number

// TypeScript will catch invalid paths
// widget.get('invalid.path'); // Error!
```

## 📦 Publishing

### Automated Publishing with Release Please

The monorepo uses Release Please for automated versioning and publishing:

1. **Commit Convention**: Use conventional commits
   ```bash
   feat: add new feature
   fix: resolve bug
   docs: update documentation
   chore: routine maintenance
   ```

2. **Automatic Release PR**: Release Please creates/updates a PR with:
   - Version bumps
   - CHANGELOG updates
   - Package.json updates

3. **Publishing**: When the release PR is merged, packages are automatically published to npm

### Manual Publishing

```bash
# Build packages first
pnpm run build

# Publish widget-types
cd packages/widget-types
npm publish --access public

# Publish widget (depends on widget-types)
cd ../widget
npm publish --access public
```

## 🔄 GitHub Actions

### CI/CD Pipeline

The workflow runs on:
- Push to `main` branch
- Pull requests
- Manual workflow dispatch

Features:
- Matrix testing (Node 18.x, 20.x)
- Coverage reporting
- Automated npm publishing
- Dynamic JSON downloading

### Environment Variables

Set in GitHub repository settings:

- `NPM_TOKEN` - npm authentication token for publishing
- `INPUT_JSON_URL` - Optional URL to download input.json

### Manual Workflow Dispatch

You can manually trigger the workflow with a custom input.json URL:

1. Go to Actions tab
2. Select "CI/CD" workflow
3. Click "Run workflow"
4. Enter JSON URL (optional)
5. Click "Run workflow"

## 🔐 Configuration

### Release Please

Configure in `release-please-config.json`:
- Package versioning strategy
- Changelog sections
- PR titles and grouping

### TypeScript

- Strict mode enabled
- ES2022 target
- Path aliases configured
- Composite projects for better performance

### Testing

- Vitest for unit testing
- Coverage with c8
- Parallel test execution
- Path aliases support

### Linting

- ESLint with TypeScript support
- Prettier for code formatting
- Husky for pre-commit hooks (optional)

## 🛠️ Troubleshooting

### Common Issues

1. **Coverage failing**: Ensure all source files have corresponding tests
2. **Type errors**: Run `pnpm run codegen` after modifying input.json
3. **Build errors**: Clean and rebuild with `pnpm run clean && pnpm run build`
4. **Publishing fails**: Check NPM_TOKEN is set correctly

### Debug Commands

```bash
# Check workspace structure
pnpm ls -r

# Verify package links
pnpm why @monorepo/widget-types

# Clean everything
pnpm run clean
rm -rf node_modules packages/*/node_modules
pnpm install
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes using conventional commits
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [pnpm Documentation](https://pnpm.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Release Please](https://github.com/googleapis/release-please)
- [Conventional Commits](https://www.conventionalcommits.org/)