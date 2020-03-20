#!/usr/bin/env node
import { Stack, App, StackProps, SecretValue} from '@aws-cdk/core';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { Bucket } from '@aws-cdk/aws-s3';
import { BuildSpec, LinuxBuildImage } from '@aws-cdk/aws-codebuild';
import { S3BucketBuilder } from './resource-builders/S3BucketBuilder';
import { CloudFrontBuilder } from './resource-builders/CloudFrontBuilder';
import { CodePiplineStageBuilder, CodePipelineBuilder} from './resource-builders/CodePipelineBuilder';
import { Artifact } from '@aws-cdk/aws-codepipeline';

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
        const testStageBuilder = new CodePiplineStageBuilder();

        const cplBuilder = new CodePipelineBuilder();

        const cpSourceActionBucket = Bucket.fromBucketName(this, 'CodePipelineBucket','codepipeline-source-action-432267630742')

        // const githubOauthToken = StringParameter.valueForStringParameter(this, '/hqv/github-token');
        // const sourceStage = sourceStageBuilder
        //     .setStageName('SourceStage')
        //     .addArtifact('githubSourceOutput')
        //     .addGitHubSourceAction({
        //         actionName: 'GitHubSourceAction',
        //         repoOwner: 'hieuvoquang87',
        //         repoName: 'template-gatsby-serverless',
        //         oauthToken: new SecretValue(githubOauthToken),
        //         outputArtifactName: 'githubSourceOutput'
        //     })
        //     .build();

        const sourceStage = sourceStageBuilder
            .setStageName('SourceStage')
            .addArtifact('s3SourceOutput')
            .addS3SourceAction('S3SourceAction', 's3SourceOutput', cpSourceActionBucket)
            .build();

        const codeBuildBuildProject = cplBuilder.buildPipelineProject(this, 'PipelineBuildProject', {
            buildSpec: BuildSpec.fromSourceFilename('frontend/buildspec.yml'),
            environment: {
                buildImage: LinuxBuildImage.AMAZON_LINUX_2_2
            }
        })
        const buildStage = buildStageBuilder
            .setStageName('BuildStage')
            .addCodeBuildAction({
                actionName: 'CodeBuildBuildAction',
                // input: sourceStage.outputs['githubSourceOutput'],
                // environmentVariables: { ...buildStageBuilder.getGitHubSourceOutputVariables() },
                input: sourceStage.outputs['s3SourceOutput'],
                outputs: [new Artifact('codeBuildOutput')],
                project: codeBuildBuildProject,
                variablesNamespace: 'CodeBuildVariables'
            })
            .build()

        const codeBuildTestProject = cplBuilder.buildPipelineProject(this, 'PipelineTestProject', {
            buildSpec: BuildSpec.fromSourceFilename('frontend/buildspec-test.yml'),
            environment: {
                buildImage: LinuxBuildImage.AMAZON_LINUX_2_2
            }
        })
        const testStage = testStageBuilder
            .setStageName('TestStage')
            .addCodeBuildAction({
                actionName: 'CodeBuildTestAction',
                input: buildStage.outputs['codeBuildOutput'],
                // environmentVariables: { ...buildStageBuilder.getGitHubSourceOutputVariables() },
                project: codeBuildTestProject
            })
            .build()

        const pipeline = cplBuilder
            .setArtifactBucket(Bucket.fromBucketName(this, 'ArtifactBucket','artifacts-432267630742'))
            .addStage(sourceStage)
            .addStage(buildStage)
            .addStage(testStage)
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
