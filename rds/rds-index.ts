import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { RdsSecurityGroupComponent } from "./module/securityGroup";
import { RdsComponent } from "./module/rds";


// Security group for RDS
const rdsSecurityGroup = new RdsSecurityGroupComponent("my-rds-sg", {
  vpcId: config.,
  allowedCidrBlocks: ["172.31.0.0/16"], // Or leave undefined to default to 0.0.0.0/0
  port: 5432,
  tags: {
    Name: "RDS security group",
    Environment: "dev",
  },
});

// RDS instance
const db = new RdsComponent("myrds", {
  instanceIdentifier: "myrds",
  dbName: "myrds",
  username: "GraceS473284",
  password: config.,
  subnetIds: ["subnet-0a4b110fd20a406e6", "subnet-07d52a5effbee9c92"],
  vpcSecurityGroupIds: [rdsSecurityGroup.securityGroup.id],
  tags: {
    Environment: "dev",
    Project: "my-rds",
  },
});

export const dbEndpoint = db.dbInstance.endpoint;
export const dbInstanceId = db.dbInstance.id;
export const dbSubnetGroupId = db.subnetGroup.id;
export const dbSecurityGroupId = rdsSecurityGroup.securityGroup.id;
export const dbSecurityGroupIngress = rdsSecurityGroup.securityGroup.ingress;

