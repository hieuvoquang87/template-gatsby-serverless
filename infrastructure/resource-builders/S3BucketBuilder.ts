import { Construct } from '@aws-cdk/core';
import { Bucket, BucketProps, IBucket, BucketEncryption } from '@aws-cdk/aws-s3';
import { OriginAccessIdentity } from '@aws-cdk/aws-cloudfront';
import { PolicyStatement, Effect, CanonicalUserPrincipal, AccountRootPrincipal } from '@aws-cdk/aws-iam';

export interface S3BucketBuilderProps {
  S3BucketName: string
}

export interface S3CloudFrontAccessIdentityProps {
  s3Bucket: IBucket
}

export class BucketExt extends Bucket {
  /**
   * This will create CloudfrontOriginAccessIdentity as a child resource (dependent resource) of S3 Bucket
   */
  addCloudfrontOriginAccessIdentity(originAccessIdentity: OriginAccessIdentity): BucketExt {
    this.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:s3:::${this.bucketName}/*`],
      actions: ['s3:GetObject'],
      principals: [
        new CanonicalUserPrincipal(originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)
      ]
    }))

    this.addToResourcePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [
        `arn:aws:s3:::${this.bucketName}`,
        `arn:aws:s3:::${this.bucketName}/*`
      ],
      actions: ['s3:PutObject', 's3:PutObjectAcl'],
      principals: [
        new AccountRootPrincipal()
      ]
    }))
    return this;
  }
}

export class S3BucketBuilder {

  private s3BucketProps: BucketProps
  private s3Bucket: BucketExt

  constructor() {}

  setBucketName(bucketName: string, versioned: boolean = false): S3BucketBuilder {
    this.s3BucketProps = {
      bucketName,
      encryption: BucketEncryption.S3_MANAGED,
      versioned
    }
    return this;
  }

  build(scope: Construct, id: string): BucketExt {
    this.s3Bucket = new BucketExt(scope, `${id}-Bucket`, this.s3BucketProps);
    return this.s3Bucket;
  }
}
