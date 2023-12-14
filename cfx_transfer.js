const { ethers, JsonRpcProvider } = require('ethers');
const provider = new JsonRpcProvider('https://evm.confluxrpc.com');
const walletsConfig = require('./wallets.json');

// 合约地址
const receiverAddress = '0xc6e865c213c89ca42a622c5572d19f00d84d7a16';

const wallets = walletsConfig.map(config => ({
  wallet: new ethers.Wallet(config.privateKey, provider),
  transferTimes: config.transferTimes
}));

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function transferCfxMultiple(wallets) {
  const promises = wallets.map(({ wallet, transferTimes }) =>
    (async () => {
      for (let i = 0; i < transferTimes; i++) {
        try {
          const nonce = await provider.getTransactionCount(wallet.address);
          const tx = {
            to: receiverAddress,
            value: 0,
            nonce: nonce
          };

          const txResponse = await wallet.sendTransaction(tx);
          console.log(`Wallet ${wallet.address} Transaction ${i + 1} hash: ${txResponse.hash}`);
          await delay(2500);

          let receipt;
          let retries = 5;
          while (retries--) {
            try {
              receipt = await txResponse.wait();
              console.log(`Wallet ${wallet.address} Transaction ${i + 1} was confirmed in block ${receipt.blockNumber}`);
              await delay(2500);
              break;
            } catch (error) {
              if (retries === 0) throw error;
              console.error(`Error with transaction ${i + 1} from wallet ${wallet.address}, retrying...`, error);
              await delay(2500); // 添加延迟
            }
          }
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
    await delay(5000); // 等待一段时间再次运行，以避免过于频繁的请求
  }
}

run().catch(console.error);