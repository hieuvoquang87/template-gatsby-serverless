import cdk = require('@aws-cdk/core');
import s3 = require('@aws-cdk/aws-s3');
import cloudfront = require('@aws-cdk/aws-cloudfront');
import route53 = require('@aws-cdk/aws-route53');
import route53Targets = require('@aws-cdk/aws-route53-targets');

export interface GlobalStackProps extends cdk.StackProps {
  env: cdk.Environment;
  accountName: string;
  appBucket: s3.IBucket;
  cloudfrontOriginAccessIdentity: cloudfront.OriginAccessIdentity;
  domainName: string;
  domainCertArn: string;
  apiDomainName: string;
}
export class GlobalStack extends cdk.Stack {
  public cloudfrontDistribution: cloudfront.CloudFrontWebDistribution

  constructor(scope: cdk.Construct, id: string, props: GlobalStackProps,) {
    super(scope, id, props,);

    const cloudfrontLogBucket = s3.Bucket.fromBucketName(this, 'CloudFrontLogBucket', 'awssplunk-us-east-1-logging-coxautomotive',);
    const cloudfrontLogPrefix = `cflogs/${props.env ? props.env.account : ''}`;

    this.cloudfrontDistribution = new cloudfront.CloudFrontWebDistribution(this, `${id}Distribution`, {
      defaultRootObject: 'index.html',
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      aliasConfiguration: {
        acmCertRef: props.domainCertArn,
        names: [props.domainName],
        sslMethod: cloudfront.SSLMethod.SNI,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2018,
      },
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: props.appBucket,
            originAccessIdentity: props.cloudfrontOriginAccessIdentity
          },
          behaviors: [{
            isDefaultBehavior: true,
            allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD,
            compress: true,
            defaultTtl: cdk.Duration.days(1,),
            forwardedValues: {
              queryString: true,
            },
          }],
          originPath: '/public',
        },
        {
          customOriginSource: {
            domainName: props.apiDomainName,
            originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          },
          behaviors: [{
            allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
            compress: true,
            cachedMethods: cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD,
            forwardedValues: {
              queryString: true,
            },
            pathPattern: 'api/*',
          }],
        }
      ],
      loggingConfig: {
        bucket: cloudfrontLogBucket,
        prefix: cloudfrontLogPrefix,
      },
    },);

    const hostZone = route53.HostedZone.fromLookup(this, 'MyZone', {
      domainName: `${props.accountName}.kbb.com`,
    },);
    const nameGroup = props.domainName.match(/^\w+/,);
    const subDomainName = nameGroup ? nameGroup[0] : '';
    new route53.ARecord(this, 'CloudFrontAlias', {
      zone: hostZone,
      recordName: subDomainName,
      target: route53.AddressRecordTarget.fromAlias(new route53Targets.CloudFrontTarget(this.cloudfrontDistribution,),),
    },);
  }
}
