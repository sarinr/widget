import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'prettier';
import { pascalCase } from 'change-case';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PackageJson {
  name: string;
  version: string;
  description: string;
  main?: string;
  module?: string;
  types?: string;
  exports?: any;
  files?: string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  publishConfig?: Record<string, any>;
  repository?: any;
  keywords?: string[];
  author?: string;
  license?: string;
  type?: string;
}

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
  }
}

function generateTypeFromValue(value: any, name: string, depth: number = 0): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const type = typeof value;

  switch (type) {
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'object':
      if (Array.isArray(value)) {
        if (value.length === 0) return 'any[]';
        const elementType = generateTypeFromValue(value[0], `${name}Element`, depth + 1);
        return `${elementType}[]`;
      } else {
        const properties = Object.entries(value)
          .map(([key, val]) => {
            const propName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
            const propType = generateTypeFromValue(val, pascalCase(key), depth + 1);
            return `  ${propName}: ${propType};`;
          })
          .join('\n');
        return `{\n${properties}\n}`;
      }
    default:
      return 'any';
  }
}

function generateInterfacesFromJson(json: any): string {
  const interfaces: string[] = [];
  const rootType = generateTypeFromValue(json, 'Root');

  interfaces.push(`export interface WidgetData ${rootType}`);

  // Generate nested interfaces for complex objects
  function extractInterfaces(obj: any, parentName: string = '') {
    if (typeof obj !== 'object' || obj === null) return;

    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const interfaceName = pascalCase(`${parentName}${key}`);
        const interfaceType = generateTypeFromValue(value, interfaceName);

        if (Object.keys(value).length > 3) {
          interfaces.push(`export interface ${interfaceName} ${interfaceType}`);
        }

        extractInterfaces(value, interfaceName);
      }
    });
  }

  extractInterfaces(json);

  return interfaces.join('\n\n');
}

function generateWidgetClass(): string {
  return `import type { WidgetData, WidgetKey, WidgetValue } from '@monorepo/widget-types';

export class Widget {
  private data: WidgetData;

  constructor(data: WidgetData) {
    this.data = structuredClone(data);
  }

  /**
   * Get a value from the widget data by key path
   * @param key - The key path to retrieve (e.g., 'widget.window.title')
   * @returns The value at the specified key path, or undefined if not found
   */
  get<K extends WidgetKey>(key: K): WidgetValue<K> {
    if ((key as string) === '') {
      return this.data as WidgetValue<K>;
    }

    const keys = key.split('.');
    let current: any = this.data;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return undefined as WidgetValue<K>;
      }
    }

    return current as WidgetValue<K>;
  }

  /**
   * Set a value in the widget data by key path
   * @param key - The key path to set (e.g., 'widget.window.title')
   * @param value - The value to set
   */
  set<K extends WidgetKey>(key: K, value: WidgetValue<K>): void {
    const keys = key.split('.');
    let current: any = this.data;

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
  }

  /**
   * Check if a key exists in the widget data
   * @param key - The key path to check
   * @returns True if the key exists, false otherwise
   */
  has(key: string): boolean {
    if (key === '') {
      return true;
    }

    const keys = key.split('.');
    let current: any = this.data;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all data
   * @returns The complete widget data
   */
  getData(): WidgetData {
    return structuredClone(this.data);
  }

  /**
   * Create a widget instance from JSON
   * @param json - The JSON data to create the widget from
   * @returns A new Widget instance
   */
  static fromJSON(json: WidgetData): Widget {
    return new Widget(json);
  }

  /**
   * Convert the widget to JSON
   * @returns The widget data as JSON
   */
  toJSON(): WidgetData {
    return this.getData();
  }
}

export default Widget;
`;
}

function generateKeyTypes(json: any, prefix: string = ''): string[] {
  const keys: string[] = [];

  function extractKeys(obj: any, currentPath: string) {
    if (typeof obj !== 'object' || obj === null) return;

    Object.entries(obj).forEach(([key, value]) => {
      const fullPath = currentPath ? `${currentPath}.${key}` : key;
      keys.push(`'${fullPath}'`);

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        extractKeys(value, fullPath);
      }
    });
  }

  extractKeys(json, prefix);
  return keys;
}

function generateValueTypeMapping(json: any): string {
  const mappings: string[] = [];

  function extractMappings(obj: any, path: string = '') {
    if (typeof obj !== 'object' || obj === null) return;

    Object.entries(obj).forEach(([key, value]) => {
      const fullPath = path ? `${path}.${key}` : key;
      const valueType = generateTypeFromValue(value, pascalCase(key));
      mappings.push(`  '${fullPath}': ${valueType};`);

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        extractMappings(value, fullPath);
      }
    });
  }

  extractMappings(json);
  return mappings.join('\n');
}

async function formatCode(code: string, parser: 'typescript' | 'json' = 'typescript'): Promise<string> {
  try {
    return await format(code, {
      parser,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
      tabWidth: 2,
    });
  } catch (error) {
    console.warn('Failed to format code:', error);
    return code;
  }
}

async function generatePackages(): Promise<void> {
  try {
    // Read input.json
    const inputPath = path.join(__dirname, '..', 'input.json');
    const inputData = await fs.readFile(inputPath, 'utf-8');
    const json = JSON.parse(inputData);

    // Create packages directory
    const packagesDir = path.join(__dirname, '..', '..', 'packages');
    await ensureDir(packagesDir);

    // Generate types package
    const typesDir = path.join(packagesDir, 'widget-types');
    await ensureDir(typesDir);
    await ensureDir(path.join(typesDir, 'src'));

    // Generate type definitions
    const interfaces = generateInterfacesFromJson(json);
    const keys = generateKeyTypes(json);
    const valueMappings = generateValueTypeMapping(json);

    const typesContent = `// Auto-generated types from input.json
${interfaces}

export type WidgetKey = ${keys.join(' | ')};

type WidgetValueMap = {
${valueMappings}
};

export type WidgetValue<K extends WidgetKey> = K extends keyof WidgetValueMap
  ? WidgetValueMap[K]
  : unknown;
`;

    await fs.writeFile(
      path.join(typesDir, 'src', 'index.ts'),
      await formatCode(typesContent)
    );

    // Create types package.json
    const typesPackageJson: PackageJson = {
      name: '@monorepo/widget-types',
      version: '0.0.1',
      description: 'TypeScript type definitions for widget data',
      type: 'module',
      main: './dist/index.js',
      module: './dist/index.js',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.js',
          require: './dist/index.cjs'
        }
      },
      files: ['dist', 'src', 'README.md'],
      scripts: {
        build: 'tsup',
        clean: 'rimraf dist',
        typecheck: 'tsc --noEmit',
        prepublishOnly: 'pnpm run clean && pnpm run build'
      },
      devDependencies: {
        '@types/node': '^20.10.0',
        'rimraf': '^5.0.5',
        'tsup': '^8.0.1',
        'typescript': '^5.3.0'
      },
      publishConfig: {
        access: 'public',
        registry: 'https://registry.npmjs.org/'
      },
      repository: {
        type: 'git',
        url: 'git+https://github.com/your-org/your-repo.git',
        directory: 'packages/widget-types'
      },
      keywords: ['widget', 'types', 'typescript'],
      author: '',
      license: 'MIT'
    };

    await fs.writeFile(
      path.join(typesDir, 'package.json'),
      await formatCode(JSON.stringify(typesPackageJson), 'json')
    );

    // Create types tsconfig.json
    const typesTsConfig = {
      extends: '../../tsconfig.json',
      compilerOptions: {
        outDir: './dist',
        rootDir: './src'
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts']
    };

    await fs.writeFile(
      path.join(typesDir, 'tsconfig.json'),
      await formatCode(JSON.stringify(typesTsConfig), 'json')
    );

    // Create types tsup.config.ts
    const tsupConfigTypes = `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['@monorepo/widget']
});
`;

    await fs.writeFile(
      path.join(typesDir, 'tsup.config.ts'),
      await formatCode(tsupConfigTypes)
    );

    // Generate widget package
    const widgetDir = path.join(packagesDir, 'widget');
    await ensureDir(widgetDir);
    await ensureDir(path.join(widgetDir, 'src'));

    const widgetContent = generateWidgetClass();

    await fs.writeFile(
      path.join(widgetDir, 'src', 'index.ts'),
      await formatCode(widgetContent)
    );

    // Create widget package.json
    const widgetPackageJson: PackageJson = {
      name: '@monorepo/widget',
      version: '0.0.1',
      description: 'A dynamic widget class for accessing JSON data',
      type: 'module',
      main: './dist/index.js',
      module: './dist/index.js',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.js',
          require: './dist/index.cjs'
        }
      },
      files: ['dist', 'src', 'README.md'],
      scripts: {
        build: 'tsup --no-dts && tsc --emitDeclarationOnly --declaration --declarationMap',
        clean: 'rimraf dist',
        typecheck: 'tsc --noEmit',
        prepublishOnly: 'pnpm run clean && pnpm run build'
      },
      dependencies: {
        '@monorepo/widget-types': '^0.0.1'
      },
      devDependencies: {
        '@types/node': '^20.10.0',
        'rimraf': '^5.0.5',
        'tsup': '^8.0.1',
        'typescript': '^5.3.0'
      },
      peerDependencies: {
        '@monorepo/widget-types': '^0.0.1'
      },
      publishConfig: {
        access: 'public',
        registry: 'https://registry.npmjs.org/'
      },
      repository: {
        type: 'git',
        url: 'git+https://github.com/your-org/your-repo.git',
        directory: 'packages/widget'
      },
      keywords: ['widget', 'json', 'data-access'],
      author: '',
      license: 'MIT'
    };

    await fs.writeFile(
      path.join(widgetDir, 'package.json'),
      await formatCode(JSON.stringify(widgetPackageJson), 'json')
    );

    // Create widget tsconfig.json
    const widgetTsConfig = {
      extends: '../../tsconfig.json',
      compilerOptions: {
        outDir: './dist',
        rootDir: './src'
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.ts', '**/*.spec.ts']
    };

    await fs.writeFile(
      path.join(widgetDir, 'tsconfig.json'),
      await formatCode(JSON.stringify(widgetTsConfig), 'json')
    );

    // Create widget tsup.config.ts
    const tsupConfigWidget = `import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['@monorepo/widget-types']
});
`;

    await fs.writeFile(
      path.join(widgetDir, 'tsup.config.ts'),
      await formatCode(tsupConfigWidget)
    );

    // Create README files
    const typesReadme = `# @monorepo/widget-types

TypeScript type definitions for widget data structures.

## Installation

\`\`\`bash
npm install @monorepo/widget-types
\`\`\`

## Usage

\`\`\`typescript
import type { WidgetData, WidgetKey, WidgetValue } from '@monorepo/widget-types';
\`\`\`

## License

MIT
`;

    await fs.writeFile(path.join(typesDir, 'README.md'), typesReadme);

    const widgetReadme = `# @monorepo/widget

A dynamic widget class for accessing JSON data with type safety.

## Installation

\`\`\`bash
npm install @monorepo/widget @monorepo/widget-types
\`\`\`

## Usage

\`\`\`typescript
import { Widget } from '@monorepo/widget';
import type { WidgetData } from '@monorepo/widget-types';

const data: WidgetData = {
  widget: {
    window: {
      title: "My Widget"
    }
  }
};

const widget = Widget.fromJSON(data);
const title = widget.get('widget.window.title'); // Type-safe access
\`\`\`

## License

MIT
`;

    await fs.writeFile(path.join(widgetDir, 'README.md'), widgetReadme);

    console.log('✅ Successfully generated packages:');
    console.log('   - @monorepo/widget-types');
    console.log('   - @monorepo/widget');

  } catch (error) {
    console.error('❌ Error generating packages:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${__filename}`) {
  generatePackages();
}

export { generatePackages };
