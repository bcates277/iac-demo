import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as config from "../config";
import { EcrRepo } from "./modules/ecr";

const demoRepo = new EcrRepo("demo-repo-2025", {
  name: "demo-repo-2025",
  encryptionConfigurations: [],
  forceDelete: true,
  imageTagMutability: "MUTABLE",
  imageScanningConfiguration: {
    scanOnPush: true,
  },
  tags: {
    Name: "demo-repo",
    Environment: "demo",
    Owner: "demo",
  },
  createIamRole: true,
  lifecyclePolicy: true,

}, );


export const repositoryUrl = demoRepo.newRepo.repositoryUrl;
export const repositoryArn = demoRepo.newRepo.arn;
export const iamRoleArn = demoRepo.iamRole?.arn;
export const repositoryPolicyName = demoRepo.repositoryPolicy?.name;