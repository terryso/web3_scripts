const { Conflux, Drip, address } = require('js-conflux-sdk');
const { ethers, Contract, JsonRpcProvider } = require('ethers');
const walletsConfig = require('./core-wallets.json');

const evmProvider = new JsonRpcProvider('https://evm.confluxrpc.com');

let abi = [
  "function balanceOf(address addr) view returns (uint)"
]

// 合约地址
const receiverAddress = '0xc6e865c213c89ca42a622c5572d19f00d84d7a16';

const cfxsContract = new Contract(receiverAddress, abi, evmProvider)

const cfx = new Conflux({
    url: 'https://main.confluxrpc.com',
    networkId: 1029,
});

const wallets = walletsConfig.map(config => ({
  wallet:  cfx.wallet.addPrivateKey(config.privateKey),
  transferTimes: config.transferTimes
}));

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function transferCfxMultiple(wallets) {
  const promises = wallets.map(({ wallet, transferTimes }) =>
    (async () => {
      let mapAddress = address.cfxMappedEVMSpaceAddress(wallet.address);
      for (let i = 0; i < transferTimes; i++) {
        try {
            // let gasPrice = await cfx.getGasPrice();
            // let increasedGasPrice = BigInt(Math.round(Number(gasPrice) * 1.01));
            // let increasedGasPriceInGDrip = new Drip(increasedGasPrice).toGDrip();
            // if (increasedGasPriceInGDrip > 170) {
            //   increasedGasPrice = Drip.fromGDrip(170)
            //   increasedGasPriceInGDrip = new Drip(increasedGasPrice).toGDrip()
            // }
            const nonce = await cfx.getNextNonce(wallet.address);
            const crossSpaceCall = cfx.InternalContract("CrossSpaceCall");
            const txHash = await crossSpaceCall.transferEVM(receiverAddress).sendTransaction({
                from: wallet,
                gasPrice: Drip.fromGDrip(190),
                nonce: nonce
            });
            console.log(`Wallet ${mapAddress} Transaction ${i + 1} hash: ${txHash} nonce: ${nonce}`);
            await delay(5000);

            let receipt = null;
            while (receipt === null) {
              receipt = await cfx.getTransactionReceipt(txHash);
              if (receipt === null) {
                console.log(`Waiting for receipt of transaction ${txHash}...`);
                await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒再次检查
              }
            }
            console.log(`Wallet ${mapAddress} Transaction ${i + 1} was confirmed`);
            const balance = await cfxsContract.balanceOf(mapAddress);
            console.log(`Wallet ${mapAddress} balance: ${balance.toString()}`);
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
    await delay(5000); // 等待一段时间再次运行，以避免过于频繁的请求
  }
}

run().catch(console.error);