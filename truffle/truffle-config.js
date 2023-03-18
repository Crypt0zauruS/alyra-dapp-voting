require("dotenv").config();
const { PRIVATE, PROVIDER_URL } = process.env;

const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  /**
   *
   * $ truffle test --network <network-name>
   */

  contracts_build_directory: "../voting/contracts",
  networks: {
    development: {
      host: "127.0.0.1", // Localhost (default: none)
      port: 8545, // Standard Ethereum port (default: none)
      network_id: "*", // Any network (default: none)
    },

    goerli: {
      provider: () => new HDWalletProvider(PRIVATE, PROVIDER_URL),
      network_id: 5, // Goerli's id
      //   confirmations: 2,    // # of confirmations to wait between deployments. (default: 0)
      //   timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      //   skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
  },

  // Set default mocha options here, use special reporters, etc.
  mocha: {
    // timeout: 100000
    reporter: "eth-gas-reporter",
    reporterOptions: {
      gasPrice: 1,
      token: "ETH",
      showTimeSpent: true,
    },
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.18", // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: false,
          runs: 200,
        },
        //  evmVersion: "byzantium"
      },
    },
  },
};
