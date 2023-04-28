import { S3Object } from "@cdktf/provider-aws/lib/s3-object";
import { getFilePaths } from "../helper/get-file-path";
import { getRelativePath } from "../helper/get-reletive-path";
import * as path from "path";
import { Construct } from "constructs";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { toIdFromFilePath } from "../helper/to-id-from-file-path";

export interface DirectoryS3ObjectConfig {
  baseDirectory: string;
  s3Bucket: S3Bucket;
}

export class DirectoryS3Object extends Construct {
  s3Objects: Array<S3Object>;

  constructor(scope: Construct, id: string, config: DirectoryS3ObjectConfig) {
    super(scope, id);
    this.s3Objects = [];
    const filePaths = getFilePaths(path.resolve(config.baseDirectory));
    console.log(filePaths);
    filePaths.forEach((filePath) => {
      const relativePath = getRelativePath(config.baseDirectory, filePath);
      console.log(filePath, relativePath);
      this.s3Objects.push(
        new S3Object(scope, `${id}_${toIdFromFilePath(relativePath)}`, {
          bucket: config.s3Bucket.bucket,
          key: relativePath,
          source: path.resolve(filePath),
          contentType: "text/html",
        })
      );
    });
  }
}
