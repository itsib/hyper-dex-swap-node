## Hyper DEX swap node

This API faciliates consuming the best-priced liquidity from the greater DEX ecosystem, including tens of on-chain and
off-chain liquidity networks. We use smart order routing to split up your transaction across decentralized exchange
networks to be filled with the lowest slippage possible while minimizing transaction costs.

## Getting started

#### Pre-requirements

- [Node.js](https://nodejs.org/en/download/) > v16.x
- [Docker](https://www.docker.com/products/docker-desktop) > 19.x
- [Docker Compose](https://docs.docker.com/compose/install/) > v1.25.4

#### Developing

To get a local development version of `hyper-dex-swap-node` running:

1. Clone the repo.

2. Create an `.env` file and copy the content from the `.env_example` file. Defaults are defined in `src/config.ts`. The
   bash environment takes precedence over the `.env` file. If you run `source .env`, changes to the `.env` file will
   have no effect until you unset the colliding variables.

| Environment Variable                        | Default               | Description                                                                                                                                                                                                                                         |
|---------------------------------------------|-----------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `LOG_LEVEL`                                 | `debug`               | error, warn, info, debug                                                                                                                                                                                                                            |
| `NODE_ENV`                                  | `development`         | Node environment.                                                                                                                                                                                                                                   |
| `PORT`                                      | `3000`                | Server listen port.                                                                                                                                                                                                                                 |
| `CORS_CREDENTIALS`                          | `false`               | Configures the Access-Control-Allow-Credentials CORS header. Set to true to pass the header, otherwise it is omitted.                                                                                                                               |
| `CORS_ORIGIN`                               | `*`                   | Configures the Access-Control-Allow-Origin CORS header. If set origin to a specific origin. For example if you set it to "http://example.com" only requests from "http://example.com" will be allowed.                                              |
| `RPC_URL`                                   | Required. No default. | The URL to a node on the network you wish to use. If you do not know what to put here, get a free [Infura account](https://infura.io/), create a project, and look at KEYS > ENDPOINTS for your network. Use the endpoint that starts with https:// |
| `QUOTE_ORDER_EXPIRATION_BUFFER_MS`          | `60000`               | For how long the quota will be saved, to save requests.                                                                                                                                                                                             |
| `WRAPPED_NATIVE`                            | Required. No default. | Wrapped native currency token address.                                                                                                                                                                                                              |
| `EXCHANGE_PROXY`                            | Required. No default. | Exchange proxy contract address.                                                                                                                                                                                                                    |
| `EXCHANGE_PROXY_TRANSFORMER_DEPLOYER`       | Required. No default. | Exchange proxy transformer deployer contract address.                                                                                                                                                                                               |
| `EXCHANGE_PROXY_FLASH_WALLET`               | Required. No default. | Internal flash wallet address.                                                                                                                                                                                                                      |
| `EXCHANGE_PROXY_LIQUIDITY_PROVIDER_SANDBOX` | Required. No default. | Exchange proxy liquidity provider sandbox contract address.                                                                                                                                                                                         |
| `WETH_TRANSFORMER`                          | Required. No default. | WETH transformer contract address.                                                                                                                                                                                                                  |
| `PAY_TAKER_TRANSFORMER`                     | Required. No default. | Pay taker transformer contract address.                                                                                                                                                                                                             |
| `AFFILIATE_FEE_TRANSFORMER`                 | Required. No default. | Affiliate fee transformer contract address.                                                                                                                                                                                                         |
| `FILL_QUOTE_TRANSFORMER`                    | Required. No default. | Fill quote transformer contract address.                                                                                                                                                                                                            |
| `POSITIVE_SLIPPAGE_FEE_TRANSFORMER`         | Required. No default. | Positive slippage fee transformer contract address.                                                                                                                                                                                                 |

3. Install the dependencies:

    ```sh
    npm install
    ```

4. Build the project:

    ```sh
    npm run build
    ```
   
   Or build docker image

   ```sh
    npm run build:docker
    ```

6. Start the API

    ```sh
    docker-compose up
    ```

   For development:

    ```sh
    npm run dev
    ```
   or
   ```sh
    npm run dev:watch
    ```

7. Enjoy yourself
