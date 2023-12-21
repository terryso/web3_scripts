const { ethers, JsonRpcProvider } = require('ethers');
const provider = new JsonRpcProvider('https://evm.confluxrpc.com');
const walletsConfig = require('./wallets.json');

// 合约地址
const receiverAddress = '0xc6e865c213c89ca42a622c5572d19f00d84d7a16';
const inputData = '0x646174613a2c7b2270223a22646572702d3230222c226f70223a226d696e74222c227469636b223a226465727073222c22616d74223a2231303030227d';

const wallets = walletsConfig.map(config => ({
  wallet: new ethers.Wallet(config.privateKey, provider),
  transferTimes: config.transferTimes
}));

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取当前主网 gas 价格
async function getGasPrice() {
  let gasPrice = (await provider.getFeeData()).gasPrice;
  // return gasPrice
  // 增加 gasPrice
  gasPrice = gasPrice + BigInt(1);
  return BigInt(gasPrice);
}

// 获取链上实时 gasLimit
async function getGasLimit(hexData, address) {
  let gasLimit = await provider.estimateGas({
    to: address,
    value: 0,
    data: hexData,
  });
  // return gasLimit
  // 增加 gasLimit
  gasLimit = gasLimit + BigInt(1);
  return BigInt(gasLimit);
}

async function transferCfxMultiple(wallets) {
  const promises = wallets.map(({ wallet, transferTimes }) =>
    (async () => {
      for (let i = 0; i < transferTimes; i++) {
        try {
          // 获取实时 gasPrice
          const currentGasPrice = await getGasPrice();
          const gasMultiple = BigInt(Math.floor(1.05 * 100));
          const increasedGasPrice = currentGasPrice * gasMultiple / BigInt(100);
          const currentGasLimit = await getGasLimit(inputData, receiverAddress);
          const nonce = await provider.getTransactionCount(wallet.address);
          const tx = {
            to: wallet.address,
            value: 0,
            nonce: nonce,
            gasPrice: increasedGasPrice,
            gasLimit: currentGasLimit,
            data: inputData,
          };

          const txResponse = await wallet.sendTransaction(tx);
          console.log(`Wallet ${wallet.address} Transaction ${i + 1} hash: ${txResponse.hash} gasPrice: ${increasedGasPrice.toString()} gasLimit: ${currentGasLimit.toString()}`);
          await delay(2500);

          receipt = await txResponse.wait();
          console.log(`Wallet ${wallet.address} Transaction ${i + 1} was confirmed in block ${receipt.blockNumber}`);
          await delay(2500);

        } catch (error) {
          console.error(`Error with transaction ${i + 1} from wallet ${wallet.address}:`, error);
        }
      }
    })().catch(error => console.error(`Error in wallet ${wallet.address}:`, error))
  );

  await Promise.all(promises);
}

async function run() {
  while (true) {
    try {
      await transferCfxMultiple(wallets);
    } catch (error) {
      console.error('Error in transferCfxMultiple:', error);
    }
    await delay(20000); // 等待一段时间再次运行，以避免过于频繁的请求
  }
}

run().catch(console.error);