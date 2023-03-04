import { Construct } from "constructs";
import { App, S3Backend, TerraformOutput, TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

class HelloStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new S3Backend(this, {
      bucket: process.env.TERRAFORM_S3_BACKEND_BUCKET,
      key: 'cdktf-tutorial/01-hello/terraform.tfstate',
      region: process.env.AWS_DEFAULT_REGION,
    });
    
    new aws.provider.AwsProvider(this, "aws", {
      region: process.env.AWS_DEFAULT_REGION,
    });

    const bucket = new aws.s3Bucket.S3Bucket(this, id, {
      bucketPrefix: `cdktf-tutorial-${id}-`,
    });

    new TerraformOutput(this, 'bucket', { value: bucket.bucket })
  }
}

const app = new App();
new HelloStack(app, "hello");
app.synth();
