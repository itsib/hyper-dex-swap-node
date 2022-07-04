## 0x Swap service

This API faciliates consuming the best-priced liquidity from the greater DEX ecosystem, including tens of on-chain and off-chain liquidity networks. We use smart order routing to split up your transaction across decentralized exchange networks to be filled with the lowest slippage possible while minimizing transaction costs.

## Getting started

#### Pre-requirements

-   [Node.js](https://nodejs.org/en/download/) > v16.x
-   [Docker](https://www.docker.com/products/docker-desktop) > 19.x
-   [Docker Compose](https://docs.docker.com/compose/install/) > v1.25.4

#### Developing

To get a local development version of `0x-swap-api` running:

1. Clone the repo.

2. Create an `.env` file and copy the content from the `.env_example` file. Defaults are defined in `config.ts`/`config.js`. The bash environment takes precedence over the `.env` file. If you run `source .env`, changes to the `.env` file will have no effect until you unset the colliding variables.

| Environment Variable                   | Default                                                           | Description                                                                                                                                                                            |
| -------------------------------------- |-------------------------------------------------------------------| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LOG_LEVEL`                            | `INFO`                                                            | NOTHING, ERROR, WARN, INFO, DEBUG.
| `LOGGER_INCLUDE_TIMESTAMP`             | `true`                                                            | Show milliseconds timestamp in log output.  
| `CHAIN_ID`                             | `42`                                                              | The chain id you'd like your API to run on (e.g: `1` -> mainnet, `42` -> Kovan, `3` -> Ropsten, `1337` -> Ganache). Defaults to `42` in the API, but required for `docker-compose up`. |
| `ETHEREUM_RPC_URL`                     | Required. No default.                                             | The URL used to issue JSON RPC requests.   
| `ETHEREUM_RPC_KEEP_ALIVE_TIMEOUT`      | `5000`                                                            | Timeout waiting for an RPC response, in milliseconds
| `EXCHANGE_PROXY_ADDRESS`               | By default used address from `@0x/contract-addresses` by chain id | Custom ZeroEx proxy contract address.
| `HTTP_PORT`                            | `3000`                                                            | Server port
| `HEALTH_CHECK_HTTP_PORT`               | By default equal of `HTTP_PORT` value                             | Server Status Check port
| `HTTP_KEEP_ALIVE_TIMEOUT`              | `5000`                                                            | Number of milliseconds of inactivity the servers waits for additional incoming data after it finished writing last response before a socket will be destroyed. Ref: https://nodejs.org/api/http.html#http_server_keepalivetimeout
| `HTTP_HEADERS_TIMEOUT`                 | `6000`                                                            | Limit the amount of time the parser will wait to receive the complete HTTP headers. NOTE: This value HAS to be higher than HTTP_KEEP_ALIVE_TIMEOUT. Ref: https://nodejs.org/api/http.html#http_server_headerstimeout
| `ETH_GAS_STATION_API_URL`              | `https://ethgasstation.api.0x.org/api/ethgasAPI.json`             | Eth Gas Station URL.

3. Install the dependencies:

    ```sh
    npm install
    ```

4. Build the project:

    ```sh
    npm run build
    ```

5. Start the API

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

6. Enjoy yourself
