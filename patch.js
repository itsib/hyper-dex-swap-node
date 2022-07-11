const fs = require('fs');
const f = 'node_modules/@0x/asset-swapper/lib/src/utils/market_operation_utils/constants.js';

console.log('To patch 0x packages');

fs.readFile(f, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  const result = data.replace(
    /https:\/\/graph-node\.beets-ftm-node\.com\/subgraphs\/name\/beethovenx/g,
    'https://api.thegraph.com/subgraphs/name/beethovenxfi/beethovenx'
  );

  fs.writeFile(f, result, 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
    console.log('0x packages was patched');
    process.exit(0);
  });
});
