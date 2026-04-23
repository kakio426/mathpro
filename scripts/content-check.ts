import path from "node:path";
import {
  ContentValidationError,
  validateContentRoot,
} from "../src/lib/content-loader";

function parseRootArg(args: string[]) {
  const rootIndex = args.findIndex((arg) => arg === "--root");

  if (rootIndex === -1) {
    return undefined;
  }

  const value = args[rootIndex + 1];

  if (!value) {
    throw new Error("Missing value for --root.");
  }

  return value;
}

try {
  const root = parseRootArg(process.argv.slice(2));
  const bundle = validateContentRoot(root);

  console.log(
    `Validated content root ${path.relative(process.cwd(), bundle.root) || bundle.root} (${bundle.lessons.length} lessons).`,
  );
} catch (error) {
  if (error instanceof ContentValidationError) {
    console.error(error.message);
    process.exit(1);
  }

  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
}
