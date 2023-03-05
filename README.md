# cdktf-tutorial

cdktf init --template="typescript" --providers="aws"
npm i -D @types/node

cdktf synth && terraform -chdir=./cdktf.out/stacks/hello init -migrate-state
