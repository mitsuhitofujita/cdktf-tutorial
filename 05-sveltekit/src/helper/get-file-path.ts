import * as fs from "fs";
import * as path from "path";

export function getFilePaths(dirPath: string): string[] {
  const filePaths: string[] = [];

  fs.readdirSync(dirPath).forEach((fileName: string) => {
    const filePath = path.join(dirPath, fileName);
    if (fs.statSync(filePath).isDirectory()) {
      filePaths.push(...getFilePaths(filePath));
    } else {
      filePaths.push(path.join(dirPath, fileName));
    }
  });

  return filePaths;
}
