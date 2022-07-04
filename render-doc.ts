import { ExtendedSpecConfig, generateSpec } from 'tsoa';
import * as packageJson from './package.json';

(async () => {
  const specOptions: ExtendedSpecConfig = {
    name: 'Hyper DEX swap API.',
    description: 'The Hyper DEX API. In aggregate, the APIs provide interfaces to Hyper DEX liquidity. Everything can be run monolithically via yarn start and docker-compose up as described in Getting Started.',
    version: packageJson.version,
    basePath: '/',
    specFileBaseName: 'hyper-dex-api-doc',
    entryFile: 'src/index.ts',
    specVersion: 3,
    outputDirectory: 'public',
    controllerPathGlobs: [
      'src/controllers/*.controller.ts'
    ],
    noImplicitAdditionalProperties: 'throw-on-extras',
    spec: {
      tags: [
        { name: "Source" },
      ],
    }
  };

  await generateSpec(specOptions);
})();
