import { Stack, App, StackProps, SecretValue} from '@aws-cdk/core';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { Bucket } from '@aws-cdk/aws-s3';
import { BuildSpec, LinuxBuildImage, Artifacts } from '@aws-cdk/aws-codebuild';
import { S3BucketBuilder } from './resource-builders/S3BucketBuilder';
import { CloudFrontBuilder } from './resource-builders/CloudFrontBuilder';
import { CodeBuildBuilder } from './resource-builders/CodeBuildBuilder';
import { CodePiplineStageBuilder, CodePipelineBuilder} from './resource-builders/CodePipelineBuilder';
import { Artifact } from '@aws-cdk/aws-codepipeline';

export class GitHubEnterprisePipelineStack extends Stack {
  constructor(parent: App, name: string, props: StackProps) {
      super(parent, name, props);

      const cbBuilder = new CodeBuildBuilder();
      const cbWatcherProject = cbBuilder
        .setProjectProps({
          projectName: 'CodeBuildWatcher',
          artifacts: Artifacts.s3({
            bucket: Bucket.fromBucketName(parent, '',''),
            packageZip: true,
            name: '',
          })
        })


      const cplBuilder = new CodePipelineBuilder();
      const cpSourceActionBucket = Bucket.fromBucketName(this, 'CodePipelineBucket','codepipeline-source-action-432267630742')

      // CodePipeline - Source Stage
      const sourceStageBuilder = new CodePiplineStageBuilder();
      const sourceStage = sourceStageBuilder
          .setStageName('SourceStage')
          .addArtifact('s3SourceOutput')
          .addS3SourceAction({ 
              actionName: 'S3SourceAction', 
              outputArtifactName: 's3SourceOutput', 
              sourceBucket: cpSourceActionBucket,
              sourceBucketKey: 'codepipelineSourceAction.zip'
          })
          .build();

      // CodePipeline - Build Stage
      const codeBuildBuildProject = cplBuilder.buildPipelineProject(this, 'PipelineBuildProject', {
          buildSpec: BuildSpec.fromSourceFilename('frontend/buildspec.yml'),
          environment: {
              buildImage: LinuxBuildImage.AMAZON_LINUX_2_2
          }
      })
      const buildStageBuilder = new CodePiplineStageBuilder();
      const buildStage = buildStageBuilder
          .setStageName('BuildStage')
          .addCodeBuildAction({
              actionName: 'CodeBuildBuildAction',
              // input: sourceStage.outputs['githubSourceOutput'],
              // environmentVariables: { ...buildStageBuilder.getGitHubSourceOutputVariables() },
              input: sourceStage.outputs['s3SourceOutput'],
              outputs: [new Artifact('codeBuildOutput')],
              project: codeBuildBuildProject,
              variablesNamespace: 'CodeBuildVariables'
          })
          .build()
      
      // CodePipeline - Build Stage
      const codeBuildTestProject = cplBuilder.buildPipelineProject(this, 'PipelineTestProject', {
          buildSpec: BuildSpec.fromSourceFilename('frontend/buildspec-test.yml'),
          environment: {
              buildImage: LinuxBuildImage.AMAZON_LINUX_2_2
          }
      })
      const testStageBuilder = new CodePiplineStageBuilder();
      const testStage = testStageBuilder
          .setStageName('TestStage')
          .addCodeBuildAction({
              actionName: 'CodeBuildTestAction',
              input: buildStage.outputs['codeBuildOutput'],
              // environmentVariables: { ...buildStageBuilder.getGitHubSourceOutputVariables() },
              project: codeBuildTestProject
          })
          .build()
      // CodePipeline - All Stages
      const pipeline = cplBuilder
          .setArtifactBucket(Bucket.fromBucketName(this, 'ArtifactBucket','artifacts-432267630742'))
          .addStage(sourceStage)
          .addStage(buildStage)
          .addStage(testStage)
          .build(this, 'AwsCdk')
 }
}