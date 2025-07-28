# Codegen

This package contains scripts for generating code from various sources.

## Valibot Schema Generation

The `valibot.ts` script generates Valibot schemas from an OpenAPI specification file.

### Usage

To generate Valibot schemas, run the following command:

```bash
pnpm --prefix codegen run generate:valibot
```

This will read the OpenAPI spec from `codegen/input.json` and generate the Valibot schemas in `packages/widget-valibot/src/index.ts`.

You can also specify the input and output files using the `--input` and `--output` command-line arguments:

```bash
pnpm --prefix codegen run generate:valibot -- --input ./my-openapi-spec.json --output ./my-valibot-schemas.ts
```

### Supported OpenAPI Features

The script currently supports the following OpenAPI features:

*   Basic types (string, number, boolean, array, object)
*   Enums
*   References to other schemas within the same file

### Future Improvements

*   Support for more OpenAPI features, such as `date`, `date-time`, `byte`, `binary`, etc.
*   Support for references to other files.
*   More robust error handling.
