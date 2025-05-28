import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

//create a new repository
const newRepo = new aws.ecr.Repository("repo-demo-day-1", {
  name: "repo-demo-day-1",
  forceDelete: true,
  imageTagMutability: "MUTABLE",
  imageScanningConfiguration: {
    scanOnPush: true,
  },
});

// Attach a lifecycle policy to the repository
const exampleLifecyclePolicy = new aws.ecr.LifecyclePolicy("LifeCyclePol", {
    repository: newRepo.name,
    policy: `{
    "rules": [
        {
            "rulePriority": 1,
            "description": "Expire images older than 14 days",
            "selection": {
                "tagStatus": "untagged",
                "countType": "sinceImagePushed",
                "countUnit": "days",
                "countNumber": 14
            },
            "action": {
                "type": "expire"
            }
        }
    ]
}
`,
});

// Attach a repository policy to the repository
const ecrPolicy = aws.iam.getPolicyDocument({
  statements: [
    {
      sid: "new policy",
      effect: "Allow",
      principals: [
        {
          type: "Service",
          identifiers: ["ec2.amazonaws.com"],
        },
      ],
      actions: [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeRepositories",
        "ecr:GetRepositoryPolicy",
        "ecr:ListImages",
        "ecr:DeleteRepository",
        "ecr:BatchDeleteImage",
        "ecr:SetRepositoryPolicy",
        "ecr:DeleteRepositoryPolicy",
      ],
    },
  ],
});

// Attach the policy to the repository
const exampleRepositoryPolicy = new aws.ecr.RepositoryPolicy("ecrRepoPolicy", {
  repository: newRepo.name,
  policy: ecrPolicy.then((policyOutput) => policyOutput.json),
});

// Exports
export const repositoryName = newRepo.name;
export const repositoryArn = newRepo.arn;
export const repositoryUrl = newRepo.repositoryUrl;
export const repositoryPolicy = exampleRepositoryPolicy.policy;
export const repositoryPolicyId = exampleRepositoryPolicy.id;
export const lifecyclePolicy = exampleLifecyclePolicy.policy;
export const lifecyclePolicyId = exampleLifecyclePolicy.id;
export const lifecyclePolicyRepository = exampleLifecyclePolicy.repository;
