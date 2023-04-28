import * as path from "path";

export function getRelativePath(
  basePath: string,
  absolutePath: string
): string {
  return path.relative(basePath, absolutePath);
}
