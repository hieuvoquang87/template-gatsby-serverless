import { Construct } from '@aws-cdk/core';
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront';
import { HostedZone, ARecord, AddressRecordTarget } from '@aws-cdk/aws-route53';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets';

export type HostedZoneProps = {
  domainName: string // Ex: awskbbfdpq.kbb.com
}

export type CloudFrontTargetProps = {
  distribution: CloudFrontWebDistribution
}

export class Route53Builder {
  constructor() {}

  private domainName: string
  private recordName: string

  private cloudfrontTarget: CloudFrontTarget

  setDomainName(domainName: string): Route53Builder {
    this.domainName = domainName

    const nameMatchedArray = domainName.match(/^\w+/);
    this.recordName = nameMatchedArray ? nameMatchedArray[0] : '';
    return this;
  }

  addCloudFrontTarget({ distribution }: CloudFrontTargetProps ): Route53Builder {
    this.cloudfrontTarget = new CloudFrontTarget(distribution);
    return this;
  }

  buildARecord(scope: Construct, id: string): ARecord {
    const hostedZone = HostedZone.fromLookup(scope, `${id}-HostedZone`, {
      domainName: this.domainName
    });

    return new ARecord(scope, 'CloudFrontAlias', {
      zone: hostedZone,
      recordName: 'ddc-plugin',
      target: AddressRecordTarget.fromAlias(this.cloudfrontTarget)
    });
  }
}
