import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import type { Construct } from 'constructs';

interface NovalensStackProps extends cdk.StackProps {
  stage: string;
}

export class NovalensStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: NovalensStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // --- DynamoDB ---
    const analysisTable = new dynamodb.Table(this, 'AnalysisTable', {
      tableName: `NovaLens-Analysis-${stage}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: stage === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    analysisTable.addGlobalSecondaryIndex({
      indexName: 'userId-createdAt-index',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // --- S3 Buckets ---
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `novalens-frontend-${stage}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const storageBucket = new s3.Bucket(this, 'StorageBucket', {
      bucketName: `novalens-storage-${stage}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ['*'], // Restrict in production
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      removalPolicy: stage === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: stage !== 'production',
    });

    // --- Cognito ---
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `novalens-users-${stage}`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      removalPolicy: stage === 'production' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      authFlows: { userSrp: true },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: [`https://${stage}.novalens.app/callback`, 'http://localhost:3000/callback'],
        logoutUrls: [`https://${stage}.novalens.app`, 'http://localhost:3000'],
      },
    });

    // --- Lambda Functions ---
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: `novalens-api-${stage}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'analysis.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        ANALYSIS_TABLE_NAME: analysisTable.tableName,
        STORAGE_BUCKET_NAME: storageBucket.bucketName,
        AGENT_FUNCTION_NAME: `novalens-agent-${stage}`,
        STAGE: stage,
      },
    });

    const agentFunction = new lambda.Function(this, 'AgentFunction', {
      functionName: `novalens-agent-${stage}`,
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'agent-controller.handler',
      code: lambda.Code.fromAsset('../backend/dist'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(120),
      environment: {
        ANALYSIS_TABLE_NAME: analysisTable.tableName,
        STORAGE_BUCKET_NAME: storageBucket.bucketName,
        BEDROCK_MODEL_ID: 'us.amazon.nova-2-lite-v1:0',
        BEDROCK_REGION: 'us-east-1',
        STAGE: stage,
      },
    });

    // Grant permissions
    analysisTable.grantReadWriteData(apiFunction);
    analysisTable.grantReadWriteData(agentFunction);
    storageBucket.grantReadWrite(apiFunction);
    storageBucket.grantRead(agentFunction);

    // apiFunction → agentFunction async invoke permission
    agentFunction.grantInvoke(apiFunction);

    // Bedrock permissions (only agentFunction needs this)
    agentFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
          'bedrock:Converse',
        ],
        resources: ['*'], // Scope to specific agent ARN in production
      }),
    );

    // --- API Gateway ---
    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: `novalens-api-${stage}`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: stage,
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
    });

    const apiResource = api.root.addResource('api');

    const analyses = apiResource.addResource('analyses');
    analyses.addMethod('POST', new apigateway.LambdaIntegration(apiFunction));
    analyses.addMethod('GET', new apigateway.LambdaIntegration(apiFunction));

    const analysisById = analyses.addResource('{id}');
    analysisById.addMethod('GET', new apigateway.LambdaIntegration(apiFunction));

    // Upload URL endpoint
    const uploadUrl = apiResource.addResource('upload-url');
    uploadUrl.addMethod('POST', new apigateway.LambdaIntegration(apiFunction));

    // --- CloudFront ---
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.RestApiOrigin(api),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    // --- Outputs ---
    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: `https://${distribution.distributionDomainName}`,
    });
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'FrontendBucketName', { value: frontendBucket.bucketName });
    new cdk.CfnOutput(this, 'StorageBucketName', { value: storageBucket.bucketName });
  }
}
