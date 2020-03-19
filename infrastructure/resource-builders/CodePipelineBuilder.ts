import { Construct, SecretValue } from '@aws-cdk/core';
import { Pipeline, StageProps, IAction, IStage, Artifact } from '@aws-cdk/aws-codepipeline';
import { GitHubSourceAction, CodeBuildAction, CodeBuildActionProps } from '@aws-cdk/aws-codepipeline-actions';
import { PipelineProject, IProject } from '@aws-cdk/aws-codebuild';

export interface CodePipelineStage extends StageProps {
  inputs: Array<Artifact>
  outputs: Array<Artifact>
}
export class CodePiplineStageBuilder {
  private stageName: string
  private actions: Array<IAction> = []
  private inputs: Array<Artifact> = []
  private outputs: Array<Artifact> = []

  setStageName(stageName: string): CodePiplineStageBuilder {
    this.stageName = stageName;
    return this;
  }

  addGitHubSourceAction(): CodePiplineStageBuilder {
    const oauthToken = new SecretValue('');
    const artifact = new Artifact('gitHubArtifact');
    const githubSourceAction = new GitHubSourceAction({
      actionName: 'githubSourceAction',
      repo: 'https://github.com/hieuvoquang87/template-gatsby-serverless',
      oauthToken,
      owner: '',
      output: artifact
    })
    this.outputs.push(artifact);
    this.actions.push(githubSourceAction);
    return this;
  }

  addCodeBuildAction({ actionName, input, project }: CodeBuildActionProps ): CodePiplineStageBuilder {
    const codebuildAction = new CodeBuildAction({
      actionName,
      input,
      project,
    }); 
    this.actions.push(codebuildAction);
    return this;
  }

  build(): CodePipelineStage {
    return {
      stageName: this.stageName,
      actions: this.actions,
      inputs: this.inputs,
      outputs: this.outputs
    }
  }
}

export class CodePipelineBuilder {
  private stages: Array<StageProps> = []

  addStage(stage: StageProps): CodePipelineBuilder {
    this.stages.push(stage);
    return this;
  }

  build(scope: Construct, id: string) {
    return new Pipeline(scope, `${id}-Pipeline`, {
      pipelineName: `${id}-Pipeline`,
      stages: this.stages
    })
  }

  buildPipelineProject(scope: Construct, id: string): IProject {
    return new PipelineProject(scope, `${id}-PipelineCodeBuildProject`, )
  } 
}
