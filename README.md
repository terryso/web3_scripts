## 这是一个批量打CFX铭文的脚本
> 旧合约地址： https://evm.confluxscan.net/address/0xc6e865c213c89ca42a622c5572d19f00d84d7a16
> 新合约地址： https://evm.confluxscan.net/address/0xd3a4d837e0a7b40de0b4024fa0f93127dd47b8b8
> 转换合约地址： https://evm.confluxscan.net/address/0x5c3c1a119300669990863861a854616ecb04b463
> 

## 安全说明
> 代码很简单，依赖也只有两到三个常用的库，绝对没有后门，不会上传私钥

## 如果觉这个脚本对你有用，麻烦打赏几个CFX买杯咖啡
1. CORE主网地址： cfx:aat673917eaz2mxbuhg4vmgdp46xaezewj75u240wy
2. eSpace主网地址： 0x092624060A4f14182800304563a3147f4b3A4Ea1

## 如何使用

### 一键转换新合约（core网）
1. 要求有node环境
2. 克隆代码
    ```
    https://github.com/terryso/web3_scripts.git
    ```
3. 进入代码目录，运行
    ```
    npm install ethers
    npm install axios
    npm install js-conflux-sdk
    ```
4. 配置钱包私钥，将core-wallets.json.example改名为core-wallets.json
5. 用编辑工具打开core-wallets.json，将你的core主网的私钥填写进去. 如果只是转换新合约，transferTimes填多少都无所谓。
    ```json
    [
      {
        "privateKey": "your private key 1",
        "transferTimes": 2
      },
      {
        "privateKey": "your private key 2",
        "transferTimes": 3
      }
    ]
    ```
    其中privateKey代表一个钱包的私钥
6. 运行脚本
    ```
    node cfx_core_claim.js
    ```
7. 已知问题
  > 一次只能转换5个，超过5个会报outOfGas的错误，暂时还不知道原因。不介意慢一点的可以使用当前这个版本的脚本
  > core网的gasPrice可以使用2GDrip，我自己测试，转换200个，大约需要0.8CFX

### 一键转换新合约（eSpace网）
1. 要求有node环境
2. 克隆代码
    ```
    https://github.com/terryso/web3_scripts.git
    ```
3. 进入代码目录，运行
    ```
    npm install ethers
    npm install axios
    ```
4. 配置钱包私钥，将wallets.json.example改名为wallets.json
5. 用编辑工具打开wallets.json，将你的eSapce主网的私钥填写进去. 如果只是转换新合约，transferTimes填多少都无所谓。
    ```json
    [
      {
        "privateKey": "your private key 1",
        "transferTimes": 2
      },
      {
        "privateKey": "your private key 2",
        "transferTimes": 3
      }
    ]
    ```
    其中privateKey代表一个钱包的私钥
6. 运行脚本
    ```
    node cfx_claim.js
    ```