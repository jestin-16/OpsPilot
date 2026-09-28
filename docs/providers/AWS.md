# AWS Provider Integration

OpsPilot provides a native AWS Integration Adapter that leverages the AWS SDK v2 to discover resources, collect logs, fetch metrics, and monitor infrastructure events across your AWS environment.

## Supported Services
The current integration focuses on the following core AWS services:
- **EC2** (Elastic Compute Cloud)
- **ECS** (Elastic Container Service)
- **EKS** (Elastic Kubernetes Service)
- **CloudWatch** (Logs & Metrics)
- **STS** (Security Token Service for validation)

## Capabilities
- `RESOURCE_DISCOVERY`: Discovers EC2 instances, ECS clusters, and EKS clusters.
- `LOGS`: Fetches log events from CloudWatch Log Groups.
- `METRICS`: Queries CloudWatch Metric Statistics for resource telemetry.
- `EVENTS`: Prepares AWS infrastructure events mapping to the normalized event engine.
- `HEALTH`: Tests authentication and validates connection health using STS `GetCallerIdentity`.

## Configuration
When creating an AWS integration in OpsPilot, the following fields are required:

### Configuration JSON
```json
{
  "region": "us-east-1"
}
```

### Secrets
```json
{
  "accessKey": "<YOUR_AWS_ACCESS_KEY>",
  "secretKey": "<YOUR_AWS_SECRET_KEY>"
}
```

## Security & Least Privilege
OpsPilot strictly adheres to the principle of least privilege. The credentials provided should only have the permissions necessary to read resources and telemetry data.

**Recommended IAM Policy:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeInstances",
                "ecs:ListClusters",
                "eks:ListClusters",
                "logs:FilterLogEvents",
                "cloudwatch:GetMetricStatistics",
                "sts:GetCallerIdentity"
            ],
            "Resource": "*"
        }
    ]
}
```
*Note: Credentials are never exposed in system logs and are securely passed to the AWS SDK StaticCredentialsProvider.*
