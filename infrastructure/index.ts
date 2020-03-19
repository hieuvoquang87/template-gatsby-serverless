#!/usr/bin/env node
import { Stack, App, StackProps} from '@aws-cdk/core';
import { S3BucketBuilder } from './resource-builders/S3BucketBuilder';
import { CloudFrontBuilder } from './resource-builders/CloudFrontBuilder';
import { CodePiplineStageBuilder, CodePipelineBuilder} from './resource-builders/CodePipelineBuilder';
import { CodeBuildBuilder, CodeBuildEnvironmentType, CodeBuildEnvironmentSize, CodeBuildEnvironmentImage } from './resource-builders/CodeBuildBuilder';

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

class CodePipelineStack extends Stack {
    constructor(parent: App, name: string, props: StackProps) {
        super(parent, name, props);

        const sourceStageBuilder = new CodePiplineStageBuilder();
        const buildStageBuilder = new CodePiplineStageBuilder();

        const cplBuilder = new CodePipelineBuilder();

        const codeBuildProject = cplBuilder.buildPipelineProject(this, 'PipelineProject')
            

        const sourceStage = sourceStageBuilder
            .setStageName('SourceStage')
            .addGitHubSourceAction()
            .build();
        const buildStage = buildStageBuilder
            .setStageName('BuildStage')
            .addCodeBuildAction({
                actionName: 'CodeBuildAction',
                input: sourceStage.outputs[0],
                project: codeBuildProject
            })
            .build()

        const pipeline = cplBuilder
            .addStage(sourceStage)
            .addStage(buildStage)
            .build(this, 'AwsCdk')
   }
}

const app = new App();

new FrontEndStack(app, 'FrontEndStack', { env: {
    // Stack must be in us-east-1, because the ACM certificate for a
    // global CloudFront distribution must be requested in us-east-1.
    region: 'us-east-1'
}});

new CodePipelineStack(app, 'CodePipelineStack', { env: {
    region: 'us-east-1'
}});

app.synth();
