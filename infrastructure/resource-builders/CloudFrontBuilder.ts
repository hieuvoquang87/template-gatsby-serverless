import { Construct, Duration } from "@aws-cdk/core";
import { IBucket } from "@aws-cdk/aws-s3";
import {
  CloudFrontWebDistributionProps,
  CloudFrontWebDistribution,
  ViewerProtocolPolicy,
  SSLMethod,
  SecurityPolicyProtocol,
  CloudFrontAllowedMethods,
  OriginProtocolPolicy,
  CloudFrontAllowedCachedMethods,
  AliasConfiguration,
  SourceConfiguration,
  LoggingConfiguration,
  OriginAccessIdentity,
  Behavior
} from "@aws-cdk/aws-cloudfront";

export type HostedZoneProps = {
  domainName: string; // Ex: awskbbfdpq.kbb.com
};

export type S3OrginSourceProps = {
  s3BucketSource: IBucket;
  originAccessIdentity: OriginAccessIdentity; // cloudfrontOriginAccessIdentity.ref
  originPath: string; // S3 Root Path. Ex: '/' or '/public'
  disableCache?: boolean;
};

export type CustomOriginSourceProps = {
  domainName: string;
  pathPattern: string; // Ex: 'api/*'
  allowedMethods?: CloudFrontAllowedMethods;
  cachedMethods?: CloudFrontAllowedCachedMethods;
};

export type CloudFrontAliasConfigurationProps = {
  acmCertRef: string;
  names: string[];
};

export type CloudFrontLogginConfiguarionProps = {
  logBucket: IBucket;
  logPrefix: string;
};

export class CloudFrontBuilder {
  private cloudfrontWebDistributionProps: CloudFrontWebDistributionProps;

  private aliasConfiguration: AliasConfiguration;
  private loggingConfiguraion: LoggingConfiguration;

  private originSourceConfigs: SourceConfiguration[] = [];

  constructor() {}

  setAliasConfiguration({
    acmCertRef,
    names
  }: CloudFrontAliasConfigurationProps): CloudFrontBuilder {
    this.aliasConfiguration = {
      acmCertRef,
      names,
      sslMethod: SSLMethod.SNI,
      securityPolicy: SecurityPolicyProtocol.TLS_V1_1_2016
    };
    return this;
  }

  setLogginConfiguration({
    logBucket,
    logPrefix
  }: CloudFrontLogginConfiguarionProps): CloudFrontBuilder {
    this.loggingConfiguraion = {
      bucket: logBucket,
      prefix: logPrefix
    };
    return this;
  }

  addS3OriginSource({
    s3BucketSource,
    originAccessIdentity,
    originPath,
    disableCache = false
  }: S3OrginSourceProps): CloudFrontBuilder {
    const s3behavior: Behavior = {
      isDefaultBehavior: true,
      allowedMethods: CloudFrontAllowedMethods.GET_HEAD,
      compress: true,
      defaultTtl: disableCache ? Duration.millis(0) : Duration.days(1),
      maxTtl: disableCache ? Duration.millis(0) : Duration.days(365),
      forwardedValues: {
        queryString: true
      }
    };
    const s3OriginSource: SourceConfiguration = {
      s3OriginSource: {
        s3BucketSource,
        originAccessIdentity
      },
      behaviors: [s3behavior],
      originPath
    };
    this.originSourceConfigs.push(s3OriginSource);
    return this;
  }

  addCustomOriginSource({
    domainName,
    pathPattern,
    allowedMethods = CloudFrontAllowedMethods.ALL,
    cachedMethods = CloudFrontAllowedCachedMethods.GET_HEAD
  }: CustomOriginSourceProps): CloudFrontBuilder {
    const customOriginSource: SourceConfiguration = {
      customOriginSource: {
        domainName: domainName,
        originProtocolPolicy: OriginProtocolPolicy.HTTPS_ONLY
      },
      behaviors: [
        {
          allowedMethods,
          compress: true,
          cachedMethods,
          forwardedValues: {
            queryString: true
          },
          pathPattern
        }
      ]
    };
    this.originSourceConfigs.push(customOriginSource);
    return this;
  }

  build(scope: Construct, id: string): CloudFrontWebDistribution {
    this.cloudfrontWebDistributionProps = {
      defaultRootObject: "index.html",
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      aliasConfiguration: this.aliasConfiguration,
      originConfigs: this.originSourceConfigs,
      loggingConfig: this.loggingConfiguraion
    };
    return new CloudFrontWebDistribution(
      scope,
      `${id}-Distribution`,
      this.cloudfrontWebDistributionProps
    );
  }

  buildOriginAccessIdentity(
    scope: Construct,
    comment?: string
  ): OriginAccessIdentity {
    return new OriginAccessIdentity(scope, `S3BucketOriginAccessIdentity`, {
      comment
    });
  }
}
