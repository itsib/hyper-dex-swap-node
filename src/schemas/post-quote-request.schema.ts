export const POST_QUOTE_REQUEST_SCHEMA = {
  title: 'Quote request parameters',
  type: 'object',
  required: ['sellToken', 'buyToken', 'takerAddress'],
  properties: {
    sellToken: {
      type: 'string',
      format: 'currency',
      errorMessage: 'must be valid token address or NATIVE',
    },
    buyToken: {
      type: 'string',
      format: 'currency',
      errorMessage: 'must be valid token address or NATIVE',
    },
    sellAmount: {
      type: 'string',
      format: 'amount',
      errorMessage: 'must be integer number',
    },
    buyAmount: {
      type: 'string',
      format: 'amount',
      errorMessage: 'must be integer number',
    },
    takerAddress: {
      type: 'string',
      format: 'address',
      errorMessage: 'must be valid account address',
    },
    slippagePercentage: {
      type: 'string',
      format: 'slippage',
      errorMessage: 'must be a number less than one and greater than zero',
    },
    excludedSources: {
      type: 'string',
    },
  },
  oneOf: [
    {
      required: ['sellAmount'],
    },
    {
      required: ['buyAmount'],
    }
  ],
  errorMessage: {
    required: {
      sellToken: 'sellToken is required',
      buyToken: 'buyToken is required',
      takerAddress: 'takerAddress is required',
    },
    _: 'sellAmount or buyAmount must be passed, not both at once.',
  },
  additionalProperties: false,
}
