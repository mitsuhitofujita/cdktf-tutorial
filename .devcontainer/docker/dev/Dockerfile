FROM node:18.14.2-bullseye

ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
        unzip \
        wget && \
    apt-get autoremove -y && \
    apt-get clean && \
	rm -rf /var/lib/apt/lists/*
ARG TERRAFORM_VERSION=1.3.9
RUN wget --progress=dot:mega https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip && \
	unzip terraform_${TERRAFORM_VERSION}_linux_amd64.zip && \
	mv terraform /usr/local/bin/ && \
	chmod +x /usr/local/bin/terraform && \
	terraform --version
ARG TERRAGRUNT_VERSION=0.44.4
RUN wget --progress=dot:mega https://github.com/gruntwork-io/terragrunt/releases/download/v${TERRAGRUNT_VERSION}/terragrunt_linux_amd64 && \
	mv terragrunt_linux_amd64 /usr/local/bin/terragrunt && \
	chmod +x /usr/local/bin/terragrunt && \
	terragrunt --version
RUN npm install -g \
        cdktf-cli
