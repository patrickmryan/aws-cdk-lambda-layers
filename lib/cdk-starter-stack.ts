import * as lambda from 'aws-cdk-lib/aws-lambda';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cdk from 'aws-cdk-lib';
// import BundlingOptions from 'aws-cdk-lib';
import * as path from 'path';
import { join } from 'path';

export class CdkStarterStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 👇 layer we've written
    const calcLayer = new lambda.LayerVersion(this, 'calc-layer', {
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_12_X,
        lambda.Runtime.NODEJS_14_X,
      ],
      code: lambda.Code.fromAsset('src/layers/calc'),
      description: 'multiplies a number by 2',
    });

    const opts = '--disable-pip-version-check --no-cache-dir'
    const layer_dir = 'layers/skyfield'
    const container_dir = '/install'

    // const dockerVolume = cdk.DockerVolume = {
    //   containerPath: container_dir,
    //   hostPath: join(__dirname, layer_dir) ,
    // });

    const skyfieldLayer = new lambda.LayerVersion(this, 'skyfield-layer', {
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
      // code: lambda.Code.fromAsset('src/layers/calc'),

      code: lambda.Code.fromAsset('layers/skyfield', {
        bundling: {
          image: new cdk.DockerImage('python:3.9-slim'), // lambda.Runtime.PYTHON_3_9.bundlingImage,
          // volumes: [dockerVolume],
          volumes: [
            // cdk.DockerVolume(
            {
              containerPath: container_dir,
              hostPath:
                '/Users/pmryan/ec/projects/galactica/aws-cdk-lambda-layers/layers/skyfield',
                // join(__dirname, layer_dir),
            }
            // ),
          ],
          // command: 'pip install'+opts+' -r '+container_dir +'/requirements.txt -t /asset-output/python',
          command: [
            // 'bash',
            // '-c',
            // 'echo',
            'pip',
            'install',
            '--disable-pip-version-check',
            '--no-cache-dir',
            '-r',
            join(container_dir, '/requirements.txt'),
            '-t',
            '/asset-output/python',
          ],
          // network: 'host'
        },
      }),
      description: 'skyfield',

      });


    // 👇 3rd party library layer
    const yupLayer = new lambda.LayerVersion(this, 'yup-layer', {
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_12_X,
        lambda.Runtime.NODEJS_14_X,
      ],
      code: lambda.Code.fromAsset('src/layers/yup-utils'),
      description: 'Uses a 3rd party library called yup',
    });

    // 👇 Lambda function
    new NodejsFunction(this, 'my-function', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'main',
      entry: path.join(__dirname, `/../src/my-lambda/index.ts`),
      bundling: {
        minify: false,
        // 👇 don't bundle `yup` layer
        // layers are already available in the lambda env
        externalModules: ['aws-sdk', 'yup'],
      },
      layers: [calcLayer, yupLayer],
    });
  }
}
