## 这是一个批量打CFX铭文的脚本
> 合约地址： https://evm.confluxscan.net/address/0xc6e865c213c89ca42a622c5572d19f00d84d7a16
> 

## 如何使用
### core 主网的使用方式（推荐，gas只有eSpace的一半）
1. 要求有node环境
2. 克隆代码
    ```
    https://github.com/terryso/web3_scripts.git
    ```
3. 进入代码目录，运行
    ```
    npm install ethers
    npm install js-conflux-sdk
    ```
4. 配置钱包私钥，将core-wallets.json.example改名为core-wallets.json
5. 用编辑工具打开core-wallets.json，将你的core主网的私钥填写进去.
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
    其中privateKey代表一个钱包的私钥，transferTimes表示这个钱包你要转账多少次
6. 运行脚本
    ```
    node cfx_core_transfer.js
    ```

### eSpace 主网的使用方式
1. 要求有node环境
2. 克隆代码
    ```
    https://github.com/terryso/web3_scripts.git
    ```
3. 进入代码目录，运行
    ```
    npm install ethers
    ```
4. 配置钱包私钥，将wallets.json.example改名为wallets.json
5. 用编辑工具打开wallets.json，将你的eSapce主网的私钥填写进去.
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
    其中privateKey代表一个钱包的私钥，transferTimes表示这个钱包你要转账多少次
6. 运行脚本
    ```
    node cfx_transfer.js
    ```