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
  // Expose the created ECR repository as a public property
  // This allows other resources to reference the ECR repository
  public readonly newRepo: aws.ecr.Repository;
  // Expose the created ECR lifecycle policy as an optional public property
  public readonly ecrLifecyclePolicy?: aws.ecr.LifecyclePolicy;
  // Expose the created IAM role as an optional public property
  public readonly iamRole?: aws.iam.Role;
  // Expose the created IAM policy as an optional public property
  public readonly repositoryPolicy?: aws.iam.RolePolicy;

  // Constructor to create an ECR repository
  constructor(
    name: string, // Logical name of the resource
    args: RepositoryArgs, // Arguments for configuring the repository
    opts?: pulumi.CustomResourceOptions // Optional Pulumi resource options
  ) {
    // Call the parent constructor for Pulumi ComponentResource
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
      { parent: this } // Set this component as the parent
    );

    // If the user requested an IAM role for ECR access
    if (args.createIamRole) {
      // Create an IAM role for the ECR repository
      this.iamRole = new aws.iam.Role(
        `${name}-ecr-role`,
        {
          // Trust policy allowing EC2 instances to assume this role
          assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
            Service: "ec2.amazonaws.com",
          }),
        },
        { parent: this }
      );

      // Define the IAM policy for ECR access
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
            Resource: this.newRepo.arn, // Restrict to this repository
          },
        ],
      };
      // Attach the policy to the IAM role
      this.repositoryPolicy = new aws.iam.RolePolicy(
        `${name}-ecr-policy`,
        {
          role: this.iamRole.name, // Attach to the created IAM role
          policy: pulumi.output(ecrPolicy).apply(JSON.stringify), // Converts to JSON
        },
        { parent: this }
      );
    }

    // If the user requested a lifecycle policy for the ECR repository
    if (args.lifecyclePolicy) {
      // Create a lifecycle policy for the ECR repository
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
            .apply(JSON.stringify), // Convert policy to JSON
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
