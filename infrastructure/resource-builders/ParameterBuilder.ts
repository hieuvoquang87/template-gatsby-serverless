import { StringParameter, ParameterType } from '@aws-cdk/aws-ssm';
import { Construct } from '@aws-cdk/core';

export type ParameterProps = {
  key: string
  value: string
  type?: ParameterType
}

export class ParameterBuilder {
  private parameterKey: string
  private parameterValue: string
  private parameterType: ParameterType

  constructor() {}

  setParameterProps(props: ParameterProps): ParameterBuilder {
    this.parameterKey = props.key;
    this.parameterValue = props.value;
    this.parameterType = props.type || ParameterType.STRING;
    return this;
  }

  setKey(key: string): ParameterBuilder {
    this.parameterKey = key;
    return this;
  }

  setValue(value: string): ParameterBuilder {
    this.parameterValue = value;
    return this;
  }

  setType(type: ParameterType): ParameterBuilder {
    this.parameterType = type;
    return this;
  }

  buildStringParameter(scope: Construct, id: string): StringParameter {
    this.parameterType = ParameterType.STRING
    return this.build(scope, id);
  }

  build(scope: Construct, id: string) {
    if(!this.parameterKey) {
      throw new Error(`${id} - Missing parameter Key`)
    }
    if(!this.parameterValue) {
      throw new Error(`${id} - Missing parameter Value`)
    }
    const paramId = this.parameterKey.replace('/','');
    return new StringParameter(scope, id, {
      type: this.parameterType,
      parameterName: this.parameterKey,
      description: `${id}-${paramId}`,
      stringValue: this.parameterValue
    });
  }
}
