import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import openapiTS from 'openapi-typescript';
import ts from 'typescript';
import { format } from 'prettier';
import minimist from 'minimist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function generateValibotSchemas(): Promise<void> {
  try {
    const args = minimist(process.argv.slice(2));
    const inputPath = args.input || path.join(__dirname, '..', 'input.json');
    const valibotOutputPath = args.output || path.join(__dirname, '..', '..', 'packages', 'widget-valibot', 'src', 'index.ts');

    const openapiSpec = await fs.readFile(inputPath, 'utf-8');
    const openapi = JSON.parse(openapiSpec);

    let valibotSchema = `import * as v from 'valibot';\n\n`;

    const components = openapi.components;
    if (components && components.schemas) {
        for (const schemaName in components.schemas) {
            const schema = components.schemas[schemaName];
            valibotSchema += `export const ${schemaName} = ${transformSchema(schema, openapi)};\n\n`;
        }
    }


    await fs.mkdir(path.dirname(valibotOutputPath), { recursive: true });
    await fs.writeFile(valibotOutputPath, await formatCode(valibotSchema));


    console.log('✅ Successfully generated Valibot schemas:');
    console.log(`   - ${valibotOutputPath}`);

  } catch (error) {
    console.error('❌ Error generating Valibot schemas:', error);
    process.exit(1);
  }
}

function transformSchema(schema: any, openapi: any): string {
  if (schema.type === 'object') {
    const properties = Object.entries(schema.properties).map(([key, value]) => {
      return `${key}: ${transformSchema(value as any, openapi)}`;
    }).join(', ');
    return `v.object({ ${properties} })`;
  }

  if (schema.type === 'array') {
    return `v.array(${transformSchema(schema.items as any, openapi)})`;
  }

  if (schema.enum) {
    return `v.union([${schema.enum.map(v => `v.literal("${v}")`).join(', ')}])`;
  }

  if (schema.type === 'string') {
    return 'v.string()';
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    return 'v.number()';
  }

  if (schema.type === 'boolean') {
    return 'v.boolean()';
  }

  if(schema['$ref']) {
    const schemaName = schema['$ref'].split('/').pop();
    return schemaName;
  }

  return 'v.any()';
}


if (import.meta.url === `file://${__filename}`) {
  generateValibotSchemas();
}

export { generateValibotSchemas };
