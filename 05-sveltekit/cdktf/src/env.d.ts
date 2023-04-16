declare module 'process' {
    global {
        namespace NodeJS {
            interface ProcessEnv {
                AWS_DEFAULT_REGION: string;
                TERRAFORM_DOMAIN: string;
                TERRAFORM_S3_BACKEND_BUCKET: string;
            }
        }
    }
}
