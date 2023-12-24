const { ethers, JsonRpcProvider } = require('ethers')
const provider = new JsonRpcProvider('https://evm.confluxrpc.com')
const walletsConfig = require('./wallets.json')
const axios = require('axios')
const fs = require('fs')

const contractAbi = [
  {
    inputs: [{ internalType: 'uint256[]', name: 'Id', type: 'uint256[]' }],
    name: 'ExTestToMain',
    outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]
const contractAddress = '0x5c3c1a119300669990863861a854616ecb04b463'
const contractMethodName = 'ExTestToMain'

const newContractAbi = [
  {
    inputs: [{ internalType: 'address', name: '_addr', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
]
const newContractAddress = '0xd3a4d837e0a7b40de0b4024fa0f93127dd47b8b8'

const wallets = walletsConfig.map(config => ({
  wallet: new ethers.Wallet(config.privateKey, provider),
  transferTimes: config.transferTimes
}))

// 设置gasPrice
const currentGasPrice = ethers.parseUnits('20', 'gwei')

async function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callContractMethodMultiple (
  wallets,
  contractAbi,
  contractAddress,
  contractMethodName
) {
  const contract = new ethers.Contract(contractAddress, contractAbi, provider)
  const newContract = new ethers.Contract(
    newContractAddress,
    newContractAbi,
    provider
  )

  const promises = wallets.map(({ wallet }) =>
    (async () => {
      try {
        // 从API获取数据
        const response = await axios.get('https://www.conins.io/getCfxsList', {
          params: {
            owner: wallet.address,
            startIndex: 0,
            size: 99999
          }
        })

        // 将ID列表分割成每32个一组
        const ids = response.data.rows.map(row => row.id)
        const maxIds = 32
        const idGroups = []
        for (let i = 0; i < ids.length; i += maxIds) {
          idGroups.push(ids.slice(i, i + maxIds))
        }

        // 读取已处理的ID
        let processedIds = []
        try {
          if (fs.existsSync(`${wallet.address}_processed_ids.json`)) {
            processedIds = JSON.parse(
              fs.readFileSync(`${wallet.address}_processed_ids.json`)
            )
          }
        } catch (error) {
          console.error(
            `Error reading processed IDs for wallet ${wallet.address}:`,
            error
          )
        }

        // 对每一组ID调用合约方法
        for (const idGroup of idGroups) {
          try {
            // 从idGroup中排除已处理的ID
            const newIdGroup = idGroup.filter(id => !processedIds.includes(id))

            // 如果newIdGroup为空，跳过当前循环
            if (newIdGroup.length === 0) continue

            const nonce = await provider.getTransactionCount(wallet.address)
            const tx = {
              nonce: nonce,
              gasPrice: currentGasPrice
            }

            const contractMethodArgs = [newIdGroup]
            const contractWithSigner = contract.connect(wallet)
            const txResponse = await contractWithSigner[contractMethodName](
              ...contractMethodArgs,
              tx
            )
            console.log(
              `Wallet ${wallet.address} Transaction hash: ${
                txResponse.hash
              } gasPrice: ${currentGasPrice.toString()}`
            )
            await delay(2500)

            // 保存已处理的ID
            processedIds = [...processedIds, ...newIdGroup]
            fs.writeFileSync(
              `${wallet.address}_processed_ids.json`,
              JSON.stringify(processedIds)
            )

            receipt = await txResponse.wait()
            console.log(
              `Wallet ${wallet.address} Transaction was confirmed in block ${receipt.blockNumber}`
            )
            await delay(2500)

            // 获取当前钱包在新合约的余额
            const balance = await newContract.balanceOf(wallet.address)
            console.log(
              `Wallet ${wallet.address} balance in new contract: ${balance}`
            )
          } catch (error) {
            console.error(
              `Error with transaction from wallet ${wallet.address}:`,
              error
            )
          }
        }
      } catch (error) {
        console.error(
          `Error with transaction from wallet ${wallet.address}:`,
          error
        )
      }
    })().catch(error =>
      console.error(`Error in wallet ${wallet.address}:`, error)
    )
  )

  await Promise.all(promises)
}

async function run () {
  while (true) {
    try {
      await callContractMethodMultiple(
        wallets,
        contractAbi,
        contractAddress,
        contractMethodName
      )
      break
    } catch (error) {
      console.error('Error in callContractMethodMultiple:', error)
    }
    await delay(20000) // 等待一段时间再次运行，以避免过于频繁的请求
  }
}

run().catch(console.error)
