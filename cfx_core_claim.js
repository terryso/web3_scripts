const { ethers, Contract, JsonRpcProvider } = require('ethers')
const { Conflux, Drip, address } = require('js-conflux-sdk')
const walletsConfig = require('./core-wallets.json')
const evmProvider = new JsonRpcProvider('https://evm.confluxrpc.com')
const axios = require('axios')
const fs = require('fs')

const cfx = new Conflux({
  url: 'https://main.confluxrpc.com',
  networkId: 1029
})

// 设置gasPrice
const gasPrice = Drip.fromGDrip(2)

// 一次对多转换多少个ID
const maxIds = 5

const contractAbi = [
  {
    inputs: [{ internalType: 'uint256[]', name: 'Id', type: 'uint256[]' }],
    name: 'ExTestToMain',
    outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'minted',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  }
]

const contractAddress = '0x5c3c1a119300669990863861a854616ecb04b463'
const contractMethodName = 'ExTestToMain'

const oldContractAbi = [
  {
    inputs: [{ internalType: 'address', name: '_addr', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
]
const oldContractAddress = '0xc6e865c213c89ca42a622c5572d19f00d84d7a16'

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
  wallet: cfx.wallet.addPrivateKey(config.privateKey),
  transferTimes: config.transferTimes
}))

async function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callContractMethodMultiple (
  wallets,
  contractAbi,
  contractAddress,
  contractMethodName
) {
  const contract = new ethers.Contract(
    contractAddress,
    contractAbi,
    evmProvider
  )
  const oldContract = new ethers.Contract(
    oldContractAddress,
    oldContractAbi,
    evmProvider
  )
  const newContract = new ethers.Contract(
    newContractAddress,
    newContractAbi,
    evmProvider
  )

  const promises = wallets.map(({ wallet }) =>
    (async () => {
      let mapAddress = address.cfxMappedEVMSpaceAddress(wallet.address)
      try {
        const crossSpaceCall = cfx.InternalContract('CrossSpaceCall')

        // 从API获取数据
        const response = await axios.get('https://www.conins.io/getCfxsList', {
          params: {
            owner: mapAddress,
            startIndex: 0,
            size: 99999
          }
        })

        // 将ID列表分割成每32个一组
        const ids = response.data.rows.map(row => row.id)
        const idGroups = []
        for (let i = 0; i < ids.length; i += maxIds) {
          idGroups.push(ids.slice(i, i + maxIds))
        }

        // 读取已处理的ID
        let processedIds = []
        try {
          if (fs.existsSync(`${mapAddress}_processed_ids.json`)) {
            processedIds = JSON.parse(
              fs.readFileSync(`${mapAddress}_processed_ids.json`)
            )
          }
        } catch (error) {
          console.error(
            `Error reading processed IDs for wallet ${mapAddress}:`,
            error
          )
        }

        // 对每一组ID调用合约方法
        for (const idGroup of idGroups) {
          try {
            // 从idGroup中排除已处理的ID
            // const newIdGroup = idGroup.filter(id => !contract.minted(id))
            let newIdGroup = []
            for (let i = 0; i < idGroup.length; i++) {
              id = idGroup[i]
              let minted = await contract.minted(id)
              if (!minted) {
                newIdGroup.push(id)
              }
            }
            console.log('ids to claim:', newIdGroup.join(', '))

            // 如果newIdGroup为空，跳过当前循环
            if (newIdGroup.length === 0) continue

            const nonce = await cfx.getNextNonce(wallet.address)
            const data = contract.interface.encodeFunctionData(
              contractMethodName,
              [newIdGroup]
            )
            const txHash = await crossSpaceCall
              .callEVM(contractAddress, data)
              .sendTransaction({
                from: wallet,
                gasPrice: gasPrice,
                nonce: nonce
              })

            console.log(
              `Wallet ${mapAddress} Transaction hash: ${txHash} nonce: ${nonce}`
            )
            await delay(2500)

            // 保存已处理的ID
            processedIds = [...processedIds, ...newIdGroup]
            fs.writeFileSync(
              `${mapAddress}_processed_ids.json`,
              JSON.stringify(processedIds)
            )

            let receipt = null
            while (receipt === null) {
              receipt = await cfx.getTransactionReceipt(txHash)
              if (receipt === null) {
                console.log(`Waiting for receipt of transaction ${txHash}...`)
                await new Promise(resolve => setTimeout(resolve, 10000)) // 等待10秒再次检查
              }
            }
            console.log(`Wallet ${mapAddress} Transaction was confirmed`)
            await delay(2500)

            // 获取当前钱包在新合约的余额
            const balance = await newContract.balanceOf(mapAddress)
            const oldContractBalance = await oldContract.balanceOf(mapAddress)
            console.log(`Wallet ${mapAddress} newContractBalance: ${balance.toString()}, oldContractBalance: ${oldContractBalance.toString()}`)
          } catch (error) {
            console.error(
              `Error with transaction from wallet ${wallet.address}:`,
              error
            )
          }
        }
      } catch (error) {
        console.error(
          `Error with transaction from wallet ${mapAddress}:`,
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
