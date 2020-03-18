#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { StaticSite } from './static-site';
import { S3BucketBuilder } from './resource-builders/S3BucketBuilder';
import { CloudFrontBuilder } from './resource-builders/CloudFrontBuilder';
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
class MyStaticSiteStack extends cdk.Stack {
    constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
        super(parent, name, props);

        // new StaticSite(this, 'StaticSite', {
        //     domainName: this.node.tryGetContext('domain'),
        //     siteSubDomain: this.node.tryGetContext('subdomain'),
        // });
        const s3Builder = new S3BucketBuilder()
        const cfBuilder = new CloudFrontBuilder();

        const originAccessIdentity = cfBuilder.buildOriginAccessIdentity(this, 'OAI for S3 Bucket');
        const s3Bucket = s3Builder
            .setBucketName(`frontend-bucket-coxautolab36`)
            .addCloudfrontOriginAccessIdentity(originAccessIdentity)
            .build(this, `S3Bucket for FrontEnd`)


   }
}

const app = new cdk.App();

new MyStaticSiteStack(app, 'FrontEndStack', { env: {
    // Stack must be in us-east-1, because the ACM certificate for a
    // global CloudFront distribution must be requested in us-east-1.
    region: 'us-east-1'
}});

app.synth();
