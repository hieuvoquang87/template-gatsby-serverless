#!/usr/bin/env ts-node
import { Stack, App, StackProps } from '@aws-cdk/core';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { CloudFrontS3StackBuilder } from 'aws-cdk-stack-builders/stack-builders/frontend/CloudFrontS3StackBuilder';
import { SimpleGitHubPipelineStack } from 'aws-cdk-stack-builders/stacks/pipeline/SimpleGitHubPipelineStack';

export class FrontEndStack extends Stack {
  constructor(parent: App, name: string, props: StackProps) {
    super(parent, name, props);

    const accountId = Stack.of(this).account;
    const region = Stack.of(this).region;

    const recordName = 'gatsby-stack';
    const domainName = 'labtest44.com';
    const s3OriginPath = '/green'
    const acmCertRef = StringParameter.valueForStringParameter(this, '/cert/com-labtest44');

    const frontendStackBuilder = new CloudFrontS3StackBuilder(this, `GatsbyFrontend`);
    frontendStackBuilder
      .createOriginAccessIdentity()
      .createS3Bucket(`${region}-${recordName}-${accountId}`)
      // .createDistributionForS3({ s3OriginPath: "/blue" });
      .createDistributionForS3WithAlias({
        acmCertRef,
        s3OriginPath,
        domainName,
        recordName
      })
  }
}
const app = new App();
const accountId = process.env.CDK_DEFAULT_ACCOUNT;
const region = 'us-east-1'

new SimpleGitHubPipelineStack(app, 'Template', {
  artifactBucketName: `${region}-artifacts-${accountId}`,
  repoName: 'https://github.com/hieuvoquang87/template-gatsby-serverless',
  repoOwner: 'hieuvoquang87',
  oauthTokenParameterKey: '/github/hieuvoquang87-token'
})

// const domain = app.node.tryGetContext('domain');
// const subdomain = app.node.tryGetContext('subdomain');

new FrontEndStack(app, 'FrontEndStack', {
  env: {
    // Stack must be in us-east-1, because the ACM certificate for a
    // global CloudFront distribution must be requested in us-east-1.
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  }
});

app.synth();
