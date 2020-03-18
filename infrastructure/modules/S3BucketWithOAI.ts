import cdk = require('@aws-cdk/core');
import s3 = require("@aws-cdk/aws-s3");
import iam = require('@aws-cdk/aws-iam');
import cloudfront = require("@aws-cdk/aws-cloudfront");

export interface DataStackProps extends cdk.StackProps {
  S3BucketName: string
}
export class DataStack extends cdk.Stack {

  public appBucket: s3.IBucket
  public cloudfrontOriginAccessIdentity: cloudfront.CfnCloudFrontOriginAccessIdentity

  constructor(scope: cdk.Construct, id: string, props: DataStackProps) {
    super(scope, id, props);
    this.templateOptions.description = 'SEW Parameter Stack';
    this.templateOptions.templateFormatVersion = '2010-09-09';

    this.appBucket = new s3.Bucket(this, props.S3BucketName, {
      bucketName: props.S3BucketName,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true
    });
    this.cloudfrontOriginAccessIdentity = new cloudfront.CfnCloudFrontOriginAccessIdentity(this, 'AppBucketOriginAccessIdentity', {
      cloudFrontOriginAccessIdentityConfig: {
        comment: 'Access S3 bucket content only through CloudFront'
      }
    });

    this.appBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [`arn:aws:s3:::${this.appBucket.bucketName}/*`],
      actions: ['s3:GetObject'],
      principals: [
        new iam.CanonicalUserPrincipal(this.cloudfrontOriginAccessIdentity.attrS3CanonicalUserId)
      ]
    }))

    this.appBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [
        `arn:aws:s3:::${this.appBucket.bucketName}`,
        `arn:aws:s3:::${this.appBucket.bucketName}/*`
      ],
      actions: ['s3:PutObject', 's3:PutObjectAcl'],
      principals: [
        new iam.AccountRootPrincipal()
      ]
    }))
  }
}
