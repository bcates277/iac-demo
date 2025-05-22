// config.ts
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const vpcId = config.requireSecret("vpcId"); // stored securely
export const databasePort = config.getNumber("databasePort") || 5432;
export const rdsSG = config.requireSecret("rdsSG"); // stored securely
export const rdspass = config.requireSecret("rdsPass"); // stored securely