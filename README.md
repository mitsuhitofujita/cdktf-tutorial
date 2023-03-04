# cdktf-tutorial

cdktf init --template="typescript" --providers="aws"

cdktf synth && terraform -chdir=./cdktf.out/stacks/hello init -migrate-state
