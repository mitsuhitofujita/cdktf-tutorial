import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";

class HelloStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // define resources here
  }
}

const app = new App();
new HelloStack(app, "hello");
app.synth();
