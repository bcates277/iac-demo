import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const repositoryResource = new awsx.ecr.Repository("repositoryResource", {
    encryptionConfigurations: [{
        encryptionType: "AES256",
    }],
    forceDelete: true,
    imageScanningConfiguration: {
        scanOnPush: true,
    },
    //images cannot be overwritten
    imageTagMutability: "MUTABLE",
    lifecyclePolicy: {
        rules: [{
            tagStatus: awsx.ecr.LifecycleTagStatus.Any,
            maximumAgeLimit: 10,
        }],
        skip: false,
    },
    name: "repo-demo-day",
    tags: {
        string: "test",
    },
});

