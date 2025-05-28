import * as pulumi from "@pulumi/pulumi";


const config = new pulumi.Config();


export const accountID = config.requireSecret("accountID"); // stored securely
