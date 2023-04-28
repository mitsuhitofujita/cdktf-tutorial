import * as path from "path";

export function toIdFromFilePath(filePath: string): string {
  return filePath
    .split(path.sep)
    .join("_")
    .replace(/[\.\-]/g, "_");
}
