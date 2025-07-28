import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import openapiTS from 'openapi-typescript';
import ts from 'typescript';
import { format } from 'prettier';

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
    const inputPath = path.join(__dirname, '..', 'input.json');
    const valibotOutputPath = path.join(__dirname, '..', '..', 'packages', 'widget-valibot', 'src', 'index.ts');

    const openapiSpec = await fs.readFile(inputPath, 'utf-8');
    const ast = await openapiTS(JSON.parse(openapiSpec));

    let valibotSchema = `import * as v from 'valibot';\n\n`;

    const componentsInterface = ast.find(node => ts.isInterfaceDeclaration(node) && node.name.escapedText === 'components') as ts.InterfaceDeclaration;

    if (componentsInterface) {
      const schemasMember = componentsInterface.members.find(member => member.name.escapedText === 'schemas') as ts.PropertySignature;
      if (schemasMember && ts.isTypeLiteralNode(schemasMember.type)) {
        for (const member of schemasMember.type.members) {
          if (ts.isPropertySignature(member)) {
            const name = member.name.escapedText as string;
            valibotSchema += `export const ${name} = ${transformNode(member.type)};\n\n`;
          }
        }
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

function transformNode(node: ts.TypeNode): string {
  if (ts.isTypeLiteralNode(node)) {
    const properties = node.members.map(member => {
      if (ts.isPropertySignature(member)) {
        const name = member.name.escapedText as string;
        const isOptional = member.questionToken ? true : false;
        const type = transformNode(member.type);
        return `${name}: ${isOptional ? `v.optional(${type})` : type}`;
      }
    }).join(', ');
    return `v.object({ ${properties} })`;
  }

  if (ts.isArrayTypeNode(node)) {
    return `v.array(${transformNode(node.elementType)})`;
  }

  if (node.kind === ts.SyntaxKind.StringKeyword) {
    return 'v.string()';
  }

  if (node.kind === ts.SyntaxKind.NumberKeyword) {
    return 'v.number()';
  }

  if (node.kind === ts.SyntaxKind.BooleanKeyword) {
    return 'v.boolean()';
  }

  if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
    return node.typeName.escapedText as string;
  }

  if (ts.isIndexedAccessTypeNode(node)) {
    const objectType = node.objectType as any;
    const indexType = node.indexType as any;
    return indexType.literal.text;
  }

  return 'v.any()';
}


if (import.meta.url === `file://${__filename}`) {
  generateValibotSchemas();
}

export { generateValibotSchemas };
