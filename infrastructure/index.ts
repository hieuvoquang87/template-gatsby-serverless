#!/usr/bin/env node
import { Stack, App, StackProps } from '@aws-cdk/core';
import { S3BucketBuilder } from './resource-builders/S3BucketBuilder';
import { CloudFrontBuilder } from './resource-builders/CloudFrontBuilder';
import { GitHubPipelineStack } from './GithubPipeline';
import { GitHubEnterprisePipelineStack } from './GithubEnterprisePipeline';

/**
 * This stack relies on getting the domain name from CDK context.
 * Use 'cdk synth -c domain=mystaticsite.com -c subdomain=www'
 * Or add the following to cdk.json:
 * {
 *   "context": {
 *     "domain": "mystaticsite.com",
 *     "subdomain": "www"
 *   }
 * }
**/
class FrontEndStack extends Stack {
    constructor(parent: App, name: string, props: StackProps) {
        super(parent, name, props);

        // new StaticSite(this, 'StaticSite', {
        //     domainName: this.node.tryGetContext('domain'),
        //     siteSubDomain: this.node.tryGetContext('subdomain'),
        // });

        const accountId = Stack.of(this).account;
        const region = Stack.of(this).region;

        const s3Builder = new S3BucketBuilder()
        const cfBuilder = new CloudFrontBuilder();

        const originAccessIdentity = cfBuilder.buildOriginAccessIdentity(this, 'OAI for S3 Bucket');
        const s3Bucket = s3Builder
            .setBucketName(`frontend-bucket-coxautolab36`)
            .build(this, `S3Bucket for FrontEnd`)
            .addCloudfrontOriginAccessIdentity(originAccessIdentity)
        cfBuilder.addS3OriginSource({
            s3BucketSource: s3Bucket,
            originAccessIdentity,
            originPath: '/blue',
            disableCache: true
        }).build(this, 'Cloudfront for Frontend')

   }
}

const app = new App();

new FrontEndStack(app, 'FrontEndStack', { env: {
    // Stack must be in us-east-1, because the ACM certificate for a
    // global CloudFront distribution must be requested in us-east-1.
    region: 'us-east-1'
}});

// new CodePipelineStack(app, 'CodePipelineStack', { env: {
//     region: 'us-east-1'
// }});

// new GitHubPipelineStack(app, 'GitHubPipelineStack', { env: {
//     region: 'us-east-1'
// }});

new GitHubEnterprisePipelineStack(app, 'GitHubEnterprisePipelineStack', { env: {
    region: 'us-east-1'
}});


app.synth();
