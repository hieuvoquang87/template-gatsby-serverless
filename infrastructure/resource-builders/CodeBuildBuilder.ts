import { IRole } from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import { Project,  IProject, CfnProjectProps, CfnProject } from '@aws-cdk/aws-codebuild';

export enum CodeBuildSourceType {
  BITBUCKET = 'BITBUCKET',
  CODECOMMIT = 'CODECOMMIT',
  CODEPIPELINE = 'CODEPIPELINE',
  GITHUB_ENTERPRISE = 'GITHUB_ENTERPRISE',
  GITHUB = 'GITHUB',
  NO_SOURCE = 'NO_SOURCE',
  S3 = 'S3'
}

export enum CodeBuildEnvironmentType {
  ARM_CONTAINER = 'ARM_CONTAINER',
  LINUX_CONTAINER = 'LINUX_CONTAINER',
  LINUX_GPU_CONTAINER = 'LINUX_GPU_CONTAINER',
  WINDOWS_CONTAINER = 'WINDOWS_CONTAINER'
}

export enum CodeBuildEnvironmentSize {
  SMALL = 'BUILD_GENERAL1_SMALL',
  MEDIUM = 'BUILD_GENERAL1_MEDIUM',
  LARGE = 'BUILD_GENERAL1_LARGE'
}

export enum CodeBuildEnvironmentImage {
  AWS_CODEBUILD_STANDARD = 'aws/codebuild/standard:2.0'
}

export enum CodeBuildArtifactsType {
  CODEPIPELINE = 'CODEPIPELINE',
  NO_ARTIFACTS = 'NO_ARTIFACTS',
  S3 = 'S3'
}

export interface SourceProperty extends CfnProject.SourceProperty {
  type: CodeBuildSourceType
  location: string
}

export interface EnvironmentProperty extends CfnProject.EnvironmentProperty {
  computeType: CodeBuildEnvironmentSize,
  image: CodeBuildEnvironmentImage | string,
  type: CodeBuildEnvironmentType
}

export interface ArtifactsProperty extends CfnProject.ArtifactsProperty {
  type: CodeBuildArtifactsType
}

export interface CodeBuildProjectProps extends CfnProjectProps {
  name: string,
  source: SourceProperty,
  environment: EnvironmentProperty,
  artifacts: ArtifactsProperty,
  serviceRole: string,
}

export class CodeBuildBuilder {
  private propjectProps: CodeBuildProjectProps
  private serviceRole: IRole
  private source: SourceProperty
  private artifacts: ArtifactsProperty
  private environment: EnvironmentProperty
  private projectName: string
  private triggers: CfnProject.ProjectTriggersProperty

  constructor() {}

  setProjectProps(props: CodeBuildProjectProps): CodeBuildBuilder {
    this.propjectProps = props;
    return this;
  }

  setProjectName(name: string): CodeBuildBuilder {
    this.projectName = name;
    return this;
  }

  setServiceRole(role: IRole): CodeBuildBuilder {
    this.serviceRole = role;
    return this;
  }

  setSource(source: SourceProperty): CodeBuildBuilder {
    this.source = source;
    return this;
  }

  setArtifacts(artifacts: ArtifactsProperty): CodeBuildBuilder {
    this.artifacts = artifacts
    return this;
  }

  setEnvironment(environment: EnvironmentProperty): CodeBuildBuilder {
    this.environment = environment;
    return this;
  }

  setTriggers(triggers: CfnProject.ProjectTriggersProperty): CodeBuildBuilder {
    this.triggers = triggers;
    return this;
  }

  build(scope: Construct, id: string): IProject {
    if(!this.serviceRole) throw new Error(`Missing CodeBuild ServiceRole for ${id}`);
    if(!this.source) throw new Error(`Missing CodeBuild Source for ${id}`);
    if(!this.environment) throw new Error(`Missing CodeBuild Environment for ${id}`);
    if(!this.artifacts) throw new Error(`Missing CodeBuild Artifacts for ${id}`);

    const codebuildProject = new CfnProject(scope, `${id}-CodeBuildProject`, {
      ...this.propjectProps,
      name: this.projectName,
      source: this.source,
      environment: this.environment,
      artifacts: this.artifacts,
      serviceRole: this.serviceRole.roleArn,
      triggers: this.triggers
    });

    return Project.fromProjectArn(scope, id, codebuildProject.attrArn);
  }
}
