import { Stack, App, StackProps } from '@aws-cdk/core';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { CloudFrontS3StackBuilder } from 'aws-cdk-stack-builders/stack-builders/frontend/CloudFrontS3StackBuilder';

export class FrontEndStack extends Stack {
  constructor(parent: App, name: string, props: StackProps) {
    super(parent, name, props);

    const accountId = Stack.of(this).account;
    const region = Stack.of(this).region;

    const recordName = 'frontend-template';
    const domainName = 'labtest44.com';
    const s3OriginPath = '/green'
    const acmCertRef = StringParameter.valueForStringParameter(this, '/cert/com-labtest44');

    const frontendStackBuilder = new CloudFrontS3StackBuilder(this, `GatsbyFrontend`);
    frontendStackBuilder
      .createOriginAccessIdentity()
      .createS3Bucket(`${region}-${recordName}-${accountId}`)
      .createDistributionForS3WithAlias({
        acmCertRef,
        s3OriginPath,
        domainName,
        recordName
      })
  }
}

const app = new App();

new FrontEndStack(app, 'TemplateFrontEndStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  }
});

app.synth();
