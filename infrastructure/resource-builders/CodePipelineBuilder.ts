import { Bucket, IBucket } from '@aws-cdk/aws-s3';
import { Construct, SecretValue } from '@aws-cdk/core';
import { Pipeline, StageProps, IAction, IStage, Artifact } from '@aws-cdk/aws-codepipeline';
import { GitHubSourceAction, CodeBuildAction, CodeBuildActionProps } from '@aws-cdk/aws-codepipeline-actions';
import { PipelineProject, IProject, BuildSpec } from '@aws-cdk/aws-codebuild';

export interface CodePipelineStage extends StageProps {
  inputs: Record<string, Artifact>
  outputs: Record<string, Artifact>
}
export class CodePiplineStageBuilder {
  private stageName: string
  private actions: Array<IAction> = []
  private inputs: Record<string, Artifact> = {}
  private outputs: Record<string, Artifact> = {}

  setStageName(stageName: string): CodePiplineStageBuilder {
    this.stageName = stageName;
    return this;
  }

  addArtifact(artifactName: string): CodePiplineStageBuilder {
    const artifact = new Artifact(artifactName);
    this.outputs[artifactName] = artifact;
    return this;
  }

  addGitHubSourceAction({ actionName, repoOwner, repoName, oauthToken, outputArtifactName }: { actionName: string, repoOwner: string, repoName: string, oauthToken: SecretValue, outputArtifactName: string } ): CodePiplineStageBuilder {
    // const oauthToken = new SecretValue('5907fa0f49df1ea4654e43bef5d3f67fc6eab6be');
    const artifact = this.outputs[outputArtifactName];
    if(!artifact) throw new Error(`Missing Output Artifact for GitHubSourceAction ${actionName}`);

    const githubSourceAction = new GitHubSourceAction({
      actionName,
      owner: repoOwner,
      repo: repoName,
      oauthToken,
      output: artifact
    })
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
  private artifactBucket: IBucket
  private stages: Array<StageProps> = []

  addStage(stage: StageProps): CodePipelineBuilder {
    this.stages.push(stage);
    return this;
  }

  setArtifactBucket(artifactBucket: IBucket): CodePipelineBuilder  {
    this.artifactBucket = artifactBucket
    return this;
  }

  build(scope: Construct, id: string) {
    return new Pipeline(scope, `${id}-Pipeline`, {
      pipelineName: `${id}-Pipeline`,
      stages: this.stages,
      artifactBucket: this.artifactBucket
    })
  }

  buildPipelineProject(scope: Construct, id: string): IProject {
    return new PipelineProject(scope, `${id}-PipelineCodeBuildProject`, {
      buildSpec: BuildSpec.fromSourceFilename('frontend/buildspec.yml')
    })
  }
}
