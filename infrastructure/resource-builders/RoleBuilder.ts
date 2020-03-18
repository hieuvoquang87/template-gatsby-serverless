import { Construct, IResolvable, Stack, Fn } from '@aws-cdk/core';
import { CfnRoleProps, IRole, Role } from '@aws-cdk/aws-iam';
import { CustomResource, CustomResourceProvider } from '@aws-cdk/aws-cloudformation';
import { Function } from '@aws-cdk/aws-lambda';
// import { Environment } from '@aws-cdk/cx-api';

interface PolicyProperty extends IResolvable {
  PolicyName: string
  PolicyDocument: any
}

export class RoleBuilder {
  private roleProps: CfnRoleProps

  constructor() {}

  setRoleProps(props: CfnRoleProps) {
    this.roleProps = {
      ...props,
      policies: (props.policies instanceof Array) ? props.policies.map((policy: any) => ({
        PolicyName: policy.policyName,
        PolicyDocument: policy.policyDocument,
      } as PolicyProperty)) : props.policies
    }
  }

  build(scope: Construct, id: string): IRole {
    try {
      const accountId = Stack.of(scope).account;
      const region = Stack.of(scope).region;
      const alksFunctionArn = Fn.importValue('ALKSify-lambda');
      const alksifyFunction = Function.fromFunctionArn(scope, `${id}-Function`, alksFunctionArn);

      const roleResource = new CustomResource(scope, `${id}-CustomResource`, {
        provider: CustomResourceProvider.fromLambda(alksifyFunction),
        properties: this.roleProps,
        resourceType: 'Custom::ALKSRole'
      })
      const roleArn = roleResource.getAtt('Arn').toString();
      return Role.fromRoleArn(scope, `${id}-AlksRole`, roleArn);
    } catch (error) {
      throw error;
    }
  }
}
