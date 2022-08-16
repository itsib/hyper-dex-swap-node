import 'hardhat-abi-exporter';
import { HardhatUserConfig, task } from 'hardhat/config';

task('fill-deployed-bytecode', 'Fills in the deployed Bytecode field in artifacts output').setAction(async (args, hre) => {
  const fullNames = await hre.artifacts.getAllFullyQualifiedNames();

  await Promise.all(fullNames.map(async fullName => {
    const [contractPath, contractName] = fullName.split(':');
    const buildInfo = await hre.artifacts.getBuildInfo(fullName);

    if (buildInfo.output.contracts?.[contractPath]?.[contractName]?.evm?.deployedBytecode) {
      const artifact = await hre.artifacts.readArtifact(fullName);
      artifact.deployedBytecode = `0x${buildInfo.output.contracts[contractPath][contractName].evm.deployedBytecode.object}`;
      await hre.artifacts.saveArtifactAndDebugFile(artifact);
    }
  }));
});

const config: HardhatUserConfig = {
  paths: {
    artifacts: './src/artifacts',
  },
  solidity: {
    version: '0.6.5',
    settings: {
      evmVersion: "istanbul",
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true,
          deduplicate: true,
        },
      },
      outputSelection: {
        "*": {
          "*": [
            "abi",
            "devdoc",
            "evm.bytecode.object",
            "evm.bytecode.sourceMap",
            "evm.deployedBytecode.object",
            "evm.deployedBytecode.sourceMap"
          ]
        }
      }
    },
  },
  abiExporter: {
    path: './src/abi',
    only: ['ERC20BridgeSampler'],
    spacing: 2,
    flat: true,
    clear: false,
  },
};

export default config;
