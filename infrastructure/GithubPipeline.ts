import { Stack, App, StackProps, SecretValue } from "@aws-cdk/core";
import { StringParameter } from "@aws-cdk/aws-ssm";
import { Bucket } from "@aws-cdk/aws-s3";
import { BuildSpec, LinuxBuildImage } from "@aws-cdk/aws-codebuild";
import { S3BucketBuilder } from "./resource-builders/S3BucketBuilder";
import { CloudFrontBuilder } from "./resource-builders/CloudFrontBuilder";
import {
  CodePiplineStageBuilder,
  CodePipelineBuilder
} from "./resource-builders/CodePipelineBuilder";
import { Artifact } from "@aws-cdk/aws-codepipeline";

export class GitHubPipelineStack extends Stack {
  constructor(parent: App, name: string, props: StackProps) {
    super(parent, name, props);

    const sourceStageBuilder = new CodePiplineStageBuilder();
    const buildStageBuilder = new CodePiplineStageBuilder();
    const testStageBuilder = new CodePiplineStageBuilder();

    const cplBuilder = new CodePipelineBuilder();

    const githubOauthToken = StringParameter.valueForStringParameter(
      this,
      "/hqv/github-token"
    );
    const sourceStage = sourceStageBuilder
      .setStageName("SourceStage")
      .addArtifact("githubSourceOutput")
      .addGitHubSourceAction({
        actionName: "GitHubSourceAction",
        repoOwner: "hieuvoquang87",
        repoName: "template-gatsby-serverless",
        oauthToken: new SecretValue(githubOauthToken),
        outputArtifactName: "githubSourceOutput"
      })
      .build();

    const codeBuildBuildProject = cplBuilder.buildPipelineProject(
      this,
      "PipelineBuildProject",
      {
        buildSpec: BuildSpec.fromSourceFilename("frontend/buildspec.yml"),
        environment: {
          buildImage: LinuxBuildImage.AMAZON_LINUX_2_2
        }
      }
    );
    const buildStage = buildStageBuilder
      .setStageName("BuildStage")
      .addCodeBuildAction({
        actionName: "CodeBuildBuildAction",
        // input: sourceStage.outputs['githubSourceOutput'],
        // environmentVariables: { ...buildStageBuilder.getGitHubSourceOutputVariables() },
        input: sourceStage.outputs["s3SourceOutput"],
        outputs: [new Artifact("codeBuildOutput")],
        project: codeBuildBuildProject,
        variablesNamespace: "CodeBuildVariables"
      })
      .build();

    const codeBuildTestProject = cplBuilder.buildPipelineProject(
      this,
      "PipelineTestProject",
      {
        buildSpec: BuildSpec.fromSourceFilename("frontend/buildspec-test.yml"),
        environment: {
          buildImage: LinuxBuildImage.AMAZON_LINUX_2_2
        }
      }
    );
    const testStage = testStageBuilder
      .setStageName("TestStage")
      .addCodeBuildAction({
        actionName: "CodeBuildTestAction",
        input: buildStage.outputs["codeBuildOutput"],
        // environmentVariables: { ...buildStageBuilder.getGitHubSourceOutputVariables() },
        project: codeBuildTestProject
      })
      .build();

    const pipeline = cplBuilder
      .setArtifactBucket(
        Bucket.fromBucketName(this, "ArtifactBucket", "artifacts-432267630742")
      )
      .addStage(sourceStage)
      .addStage(buildStage)
      .addStage(testStage)
      .build(this, "AwsCdk");
  }
}
