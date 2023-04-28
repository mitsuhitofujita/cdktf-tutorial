import { App } from "cdktf";
import { WebStack } from "./stacks/web-stack";

const project = "cdktf-tutorial";
const environment = "dev";
const app = new App();
new WebStack(app, "sveltekit", {
  backend: {
    bucket: process.env.TERRAFORM_S3_BACKEND_BUCKET,
    key: `${project}/05-sveltekit/${environment}.tfstate`,
    region: process.env.AWS_DEFAULT_REGION,
  },
  provider: {
    region: process.env.AWS_DEFAULT_REGION,
  },
  domain: process.env.TERRAFORM_DOMAIN,
  project,
  environment,
  region: process.env.AWS_DEFAULT_REGION,
});
app.synth();

/*
function getFilesWithDirectoryNames(dirPath: string): Array<{ directory: string; fileName: string }> {
  const files: Array<{ directory: string; fileName: string }> = [];

  fs.readdirSync(dirPath).forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      // サブディレクトリを再帰的に処理する
      const subDirectoryFiles = getFilesWithDirectoryNames(filePath);
      files.push(...subDirectoryFiles);
    } else {
      const directoryName = path.basename(dirPath);
      files.push({ directory: directoryName, fileName: file });
    }
  });

  return files;
}
*/