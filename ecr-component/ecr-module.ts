import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface RepositoryArgs {
  // The name of the ECR repository
  name: pulumi.Input<string>;

  // The encryption configuration for the ECR repository. Can be KMS or AES256
  encryptionConfigurations: pulumi.Input<
    pulumi.Input<aws.types.input.ecr.RepositoryEncryptionConfiguration>[]
  >;

  // The force delete option for the ECR repository
  // If set to true, the repository can be deleted even if it contains images
  // If set to false, the repository cannot be deleted if it contains images
  forceDelete?: pulumi.Input<boolean>;

  // The image tag mutability for the ECR repository
  // If set to "IMMUTABLE", the image tags cannot be overwritten
  // If set to "MUTABLE", the image tags can be overwritten
  imageTagMutability: pulumi.Input<"IMMUTABLE" | "MUTABLE">;

  // The image scanning configuration for the ECR repository
  imageScanningConfiguration: pulumi.Input<aws.types.input.ecr.RepositoryImageScanningConfiguration>;

  // The tags to assign to the ECR repository
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
 
  // The IAM role to create for the ECR repository
  createIamRole?: pulumi.Input<boolean>;

  // The IAM policy actions for the IAM role
  // If set, the IAM role will have permissions to perform these actions on the ECR repository

  // The lifecycle policy for the ECR repository
  lifecyclePolicy?: pulumi.Input<boolean>;
}

// Class to create an ECR repository with optional IAM role and policy
export class EcrRepo extends pulumi.ComponentResource {
  public readonly newRepo: aws.ecr.Repository;
  public readonly ecrLifecyclePolicy?: aws.ecr.LifecyclePolicy;
  public readonly iamRole?: aws.iam.Role;
  public readonly repositoryPolicy?: aws.iam.RolePolicy;

  // Constructor to create an ECR repository
  constructor(
    name: string,
    args: RepositoryArgs,
    opts?: pulumi.CustomResourceOptions
  ) {
    super("ecrdemo:aws:ecr", name, {}, opts);

    // Create a new ECR repository
    this.newRepo = new aws.ecr.Repository(
      name,
      {
        name: args.name,
        encryptionConfigurations: args.encryptionConfigurations,
        forceDelete: args.forceDelete,
        imageScanningConfiguration: args.imageScanningConfiguration,
        imageTagMutability: args.imageTagMutability,
        tags: args.tags,
      },
      { parent: this }
    );

    // Optional IAM role to access the ECR repository
    if (args.createIamRole) {
      this.iamRole = new aws.iam.Role(
        `${name}-ecr-role`,
        {
          assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
            Service: "ec2.amazonaws.com",
          }),
        },
        { parent: this }
      );

      const ecrPolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "ecr:GetDownloadUrlForLayer",
              "ecr:BatchGetImage",
              "ecr:BatchCheckLayerAvailability",
              "ecr:PutImage",
              "ecr:InitiateLayerUpload",
              "ecr:UploadLayerPart",
              "ecr:CompleteLayerUpload",
              "ecr:GetAuthorizationToken",
            ],
            Resource: this.newRepo.arn,
          },
        ],
      };

      this.repositoryPolicy = new aws.iam.RolePolicy(
        `${name}-ecr-policy`,
        {
          role: this.iamRole.name,
          policy: pulumi.output(ecrPolicy).apply(JSON.stringify),
        },
        { parent: this }
      );
    }
        if (args.lifecyclePolicy) {
      this.ecrLifecyclePolicy = new aws.ecr.LifecyclePolicy(
        `${name}-lifecycle-policy`,
        {
          repository: this.newRepo.name,
          policy: pulumi
            .output({
              rules: [
                {
                  rulePriority: 1,
                  description: "Expire untagged images older than 30 days",
                  selection: {
                    tagStatus: "untagged",
                    countType: "sinceImagePushed",
                    countUnit: "days",
                    countNumber: 30,
                  },
                  action: {
                    type: "expire",
                  },
                },
              ],
            })
            .apply(JSON.stringify),
        },
        { parent: this }
      );
    }

    // Register the outputs of the ECR repository, IAM role, and policy
    this.registerOutputs({
      repository: this.newRepo,
      iamRole: this.iamRole,
      repositoryPolicy: this.repositoryPolicy,
      lifecyclePolicy: this.ecrLifecyclePolicy,
    });
  }
}

