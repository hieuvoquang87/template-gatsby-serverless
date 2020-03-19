import { Construct } from '@aws-cdk/core';
import { Pipeline, StageProps } from '@aws-cdk/aws-codepipeline';


export class CodePipelineBuilder {
  private stages: [StageProps]
  build(scope: Construct, id: string) {
    return new Pipeline(scope, `${id}-Pipeline`, {
      pipelineName: `${id}-Pipeline`,
      stages: this.stages
    })
  }
}
