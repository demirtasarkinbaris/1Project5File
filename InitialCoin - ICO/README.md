# Launch your own Initial Coin Offering

Now it's time for you to launch a token for `Crypto Devs`. Let's call the token Crypto Dev Token.

![](https://i.imgur.com/78uY3Mm.png)

## Build

## Requirements

- There should be a max of `10,000 CD` tokens.
- Every `Crypto Dev` NFT holder should get 10 tokens for free but they would have to pay the gas fees.
- The price of one CD at the time of ICO should be `0.001 ether`.
- There should be a website that users can visit for the ICO.

Let's start building 🚀

## Prerequisites

- You must have completed the [NFT-Collection tutorial](https://github.com/LearnWeb3DAO/NFT-Collection).

## Theory

- What is an ERC20?
  - ERC-20 is a technical standard; it is used for all smart contracts on the Ethereum blockchain for token implementation and provides a list of rules that all Ethereum-based tokens must follow.
  - Please look at all the ERC20 [functions](https://docs.openzeppelin.com/contracts/2.x/api/token/erc20) before moving ahead.

## Build

### Smart Contract

To build the smart contract we will be using [Hardhat](https://hardhat.org/). Hardhat is an Ethereum development environment and framework designed for full stack development in Solidity. In simple words you can write your smart contracts, deploy them, run tests, and debug your code.

- To setup a Hardhat project, open up a terminal and execute these commands:

  ```bash
  mkdir ICO
  cd ICO
  mkdir hardhat-tutorial
  cd hardhat-tutorial
  npm init --yes
  npm install --save-dev hardhat
  ```

- In the same directory where you installed Hardhat run:

  ```bash
  npx hardhat
  ```

  - Select `Create a Javascript project`
  - Press enter for the already specified `Hardhat Project root`
  - Press enter for the question on if you want to add a `.gitignore`
  - Press enter for `Do you want to install this sample project's dependencies with npm (@nomicfoundation/hardhat-toolbox)?`

Now you have a hardhat project ready to go!

If you are on Windows, please do this extra step and install these libraries as well :)

```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

- In the same terminal, install `@openzeppelin/contracts` as we will be importing [Openzeppelin's ERC20 Contract](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol) and [Openzeppelin's Ownable Contract](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol) in our `CryptoDevToken` contract.

  ```bash
  npm install @openzeppelin/contracts
  ```

- We need to call the `CryptoDevs Contract` that you deployed for the previous level to check for owners of CryptoDev NFT's. As we only need to call `tokenOfOwnerByIndex` and `balanceOf` methods, we can create an interface for `CryptoDevs contract` with only these two functions. This way we save `gas` as we do not need to inherit and deploy the entire `CryptoDevs Contract`, but only a part of it.

- Create a new file inside the `contracts` directory and call it `ICryptoDevs.sol`. Add the following lines:

  ```go
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.0;

  interface ICryptoDevs {
      /**
       * @dev Returns a token ID owned by `owner` at a given `index` of its token list.
       * Use along with {balanceOf} to enumerate all of ``owner``'s tokens.
       */
      function tokenOfOwnerByIndex(address owner, uint256 index)
          external
          view
          returns (uint256 tokenId);

      /**
       * @dev Returns the number of tokens in ``owner``'s account.
       */
      function balanceOf(address owner) external view returns (uint256 balance);
  }

  ```

- Create another file inside the `contracts` directory and call it `CryptoDevToken.sol`. Add the following lines:

  ```go
    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;

    import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
    import "@openzeppelin/contracts/access/Ownable.sol";
    import "./ICryptoDevs.sol";

    contract CryptoDevToken is ERC20, Ownable {
        // Price of one Crypto Dev token
        uint256 public constant tokenPrice = 0.001 ether;
        // Each NFT would give the user 10 tokens
        // It needs to be represented as 10 * (10 ** 18) as ERC20 tokens are represented by the smallest denomination possible for the token
        // By default, ERC20 tokens have the smallest denomination of 10^(-18). This means, having a balance of (1)
        // is actually equal to (10 ^ -18) tokens.
        // Owning 1 full token is equivalent to owning (10^18) tokens when you account for the decimal places.
        // More information on this can be found in the Freshman Track Cryptocurrency tutorial.
        uint256 public constant tokensPerNFT = 10 * 10**18;
        // the max total supply is 10000 for Crypto Dev Tokens
        uint256 public constant maxTotalSupply = 10000 * 10**18;
        // CryptoDevsNFT contract instance
        ICryptoDevs CryptoDevsNFT;
        // Mapping to keep track of which tokenIds have been claimed
        mapping(uint256 => bool) public tokenIdsClaimed;

        constructor(address _cryptoDevsContract) ERC20("Crypto Dev Token", "CD") {
            CryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);
        }

        /**
         * @dev Mints `amount` number of CryptoDevTokens
         * Requirements:
         * - `msg.value` should be equal or greater than the tokenPrice * amount
         */
        function mint(uint256 amount) public payable {
            // the value of ether that should be equal or greater than tokenPrice * amount;
            uint256 _requiredAmount = tokenPrice * amount;
            require(msg.value >= _requiredAmount, "Ether sent is incorrect");
            // total tokens + amount <= 10000, otherwise revert the transaction
            uint256 amountWithDecimals = amount * 10**18;
            require(
                (totalSupply() + amountWithDecimals) <= maxTotalSupply,
                "Exceeds the max total supply available."
            );
            // call the internal function from Openzeppelin's ERC20 contract
            _mint(msg.sender, amountWithDecimals);
        }

        /**
         * @dev Mints tokens based on the number of NFT's held by the sender
         * Requirements:
         * balance of Crypto Dev NFT's owned by the sender should be greater than 0
         * Tokens should have not been claimed for all the NFTs owned by the sender
         */
        function claim() public {
            address sender = msg.sender;
            // Get the number of CryptoDev NFT's held by a given sender address
            uint256 balance = CryptoDevsNFT.balanceOf(sender);
            // If the balance is zero, revert the transaction
            require(balance > 0, "You dont own any Crypto Dev NFT's");
            // amount keeps track of number of unclaimed tokenIds
            uint256 amount = 0;
            // loop over the balance and get the token ID owned by `sender` at a given `index` of its token list.
            for (uint256 i = 0; i < balance; i++) {
                uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);
                // if the tokenId has not been claimed, increase the amount
                if (!tokenIdsClaimed[tokenId]) {
                    amount += 1;
                    tokenIdsClaimed[tokenId] = true;
                }
            }
            // If all the token Ids have been claimed, revert the transaction;
            require(amount > 0, "You have already claimed all the tokens");
            // call the internal function from Openzeppelin's ERC20 contract
            // Mint (amount * 10) tokens for each NFT
            _mint(msg.sender, amount * tokensPerNFT);
        }

        /**
          * @dev withdraws all ETH and tokens sent to the contract
          * Requirements:
          * wallet connected must be owner's address
          */
        function withdraw() public onlyOwner {
          address _owner = owner();
          uint256 amount = address(this).balance;
          (bool sent, ) = _owner.call{value: amount}("");
          require(sent, "Failed to send Ether");
        }

        // Function to receive Ether. msg.data must be empty
        receive() external payable {}

        // Fallback function is called when msg.data is not empty
        fallback() external payable {}
    }

  ```

- Now we will install the `dotenv` package to be able to import the env file and use it in our config. Open up a terminal pointing to the `hardhat-tutorial` directory and execute this command:

  ```bash
  npm install dotenv
  ```

- Create a `.env` file in the `hardhat-tutorial` folder and add the following lines. Use the instructions in the comments to get your Alchemy API Key URL and Private Key. Make sure that the account from which you get your private key is funded with Mumbai Matic.

  ```bash

  // Go to https://www.alchemyapi.io, sign up, create
  // a new App in its dashboard and select the network as Mumbai, and replace "add-the-alchemy-key-url-here" with its key url
  ALCHEMY_API_KEY_URL="add-the-alchemy-key-url-here"

  // Replace this private key with your account private key
  // To export your private key from Metamask, open Metamask and
  // go to Account Details > Export Private Key
  // Be aware of NEVER putting real Ether into testing accounts
  PRIVATE_KEY="add-the-private-key-here"
  ```

- Let's deploy the contract to the `mumbai` network. Create a new file (or replace the existing default file) named `deploy.js` under the `scripts` folder.

- Now we will write some code to deploy the contract in `deploy.js` file.

  ```js
  const { ethers } = require("hardhat");
  require("dotenv").config({ path: ".env" });
  const { CRYPTO_DEVS_NFT_CONTRACT_ADDRESS } = require("../constants");

  async function main() {
  	// Address of the Crypto Devs NFT contract that you deployed in the previous module
  	const cryptoDevsNFTContract = CRYPTO_DEVS_NFT_CONTRACT_ADDRESS;

  	/*
      A ContractFactory in ethers.js is an abstraction used to deploy new smart contracts,
      so cryptoDevsTokenContract here is a factory for instances of our CryptoDevToken contract.
      */
  	const cryptoDevsTokenContract = await ethers.getContractFactory(
  		"CryptoDevToken"
  	);

  	// deploy the contract
  	const deployedCryptoDevsTokenContract =
  		await cryptoDevsTokenContract.deploy(cryptoDevsNFTContract);

  	// print the address of the deployed contract
  	console.log(
  		"Crypto Devs Token Contract Address:",
  		deployedCryptoDevsTokenContract.address
  	);
  }

  // Call the main function and catch if there is any error
  main()
  	.then(() => process.exit(0))
  	.catch((error) => {
  		console.error(error);
  		process.exit(1);
  	});
  ```

- You can see that the `deploy.js` file requires a constant. Let's create a `constants` folder under `hardhat-tutorial` folder.
- Inside the `constants` folder create a new file named `index.js` and add the following lines to it.

  - Replace "address-of-the-nft-contract" with the address of the `CryptoDevs.sol` that you deployed in the previous module(`NFT-Collection`):

    ```js
    // Address of the NFT Contract that you deployed
    const CRYPTO_DEVS_NFT_CONTRACT_ADDRESS = "address-of-the-nft-contract";

    module.exports = { CRYPTO_DEVS_NFT_CONTRACT_ADDRESS };
    ```

- Now open the `hardhat.config.js` file, we will add the `mumbai` network here so that we can deploy our contract to Goerli. Replace all the lines in the `hardhat.config.js` file with the given below lines:

  ```js
  require("@nomicfoundation/hardhat-toolbox");
  require("dotenv").config({ path: ".env" });

  const ALCHEMY_API_KEY_URL = process.env.ALCHEMY_API_KEY_URL;

  const PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY;

  module.exports = {
  	solidity: "0.8.9",
  	networks: {
  		mumbai: {
  			url: ALCHEMY_API_KEY_URL,
  			accounts: [PRIVATE_KEY],
  		},
  	},
  };
  ```

- Compile the contract, open up a terminal pointing to the `hardhat-tutorial` directory and execute this command:

  ```bash
     npx hardhat compile
  ```

- Execute this command in the same directory to deploy the contract:
  ```bash
    npx hardhat run scripts/deploy.js --network mumbai
  ```
- Save the CryptoDevToken Contract Address that was printed to your terminal in your notepad. You will need it later in the tutorial.

### Website

- To develop the website we will be using [React](https://reactjs.org/) and [Next Js](https://nextjs.org/). React is a javascript framework which is used to make websites and Next Js is built on top of React.
- You first need to create a new `next` app. Your folder structure should look something like this:

  ```
     - ICO
         - hardhat-tutorial
         - my-app
  ```

- To create this `my-app`, in the terminal point to the `ICO` folder and type:

  ```bash
      npx create-next-app@latest
  ```

  and press `enter` for all the questions.

- Now to run the app, execute these commands in the terminal:

  ```
  cd my-app
  npm run dev
  ```

- Now go to `http://localhost:3000`, your app should be running 🤘

- Now let's install the Web3Modal library(https://github.com/Web3Modal/web3modal). Web3Modal is an easy-to-use library to help developers add support for multiple providers in their apps with a simple customizable configuration. By default Web3Modal Library supports injected providers like (Metamask, Dapper, Gnosis Safe, Frame, Web3 Browsers, etc). You can also easily configure the library to support Portis, Fortmatic, Squarelink, Torus, Authereum, D'CENT Wallet, and Arkane.
  Open up a terminal pointing to `my-app` directory and execute this command:

  ```bash
    npm install web3modal
  ```

- In the same terminal also install `ethers.js`:

  ```bash
  npm install ethers
  ```

- In the `public` folder, download the following image (https://github.com/LearnWeb3DAO/NFT-Collection/tree/main/my-app/public/cryptodevs/0.svg). Make sure that the name of the downloaded image is `0.svg`.

- Now go to styles folder and replace all the contents of `Home.modules.css` file with the following code. This will add some styling to your dapp:

  ```css
  .main {
  	min-height: 90vh;
  	display: flex;
  	flex-direction: row;
  	justify-content: center;
  	align-items: center;
  	font-family: "Courier New", Courier, monospace;
  }

  .footer {
  	display: flex;
  	padding: 2rem 0;
  	border-top: 1px solid #eaeaea;
  	justify-content: center;
  	align-items: center;
  }

  .image {
  	width: 70%;
  	height: 50%;
  	margin-left: 20%;
  }

  .input {
  	width: 200px;
  	height: 100%;
  	padding: 1%;
  	margin-bottom: 2%;
  	box-shadow: 0 0 15px 4px rgba(0, 0, 0, 0.06);
  	border-radius: 10px;
  }

  .title {
  	font-size: 2rem;
  	margin: 2rem 0;
  }

  .description {
  	line-height: 1;
  	margin: 2rem 0;
  	font-size: 1.2rem;
  }

  .button {
  	border-radius: 4px;
  	background-color: blue;
  	border: none;
  	color: #ffffff;
  	font-size: 15px;
  	padding: 5px;
  	width: 100px;
  	cursor: pointer;
  	margin-bottom: 2%;
  }
  @media (max-width: 1000px) {
  	.main {
  		width: 100%;
  		flex-direction: column;
  		justify-content: center;
  		align-items: center;
  	}
  }
  ```

- Open the `index.js` file under the `pages` folder and paste the following code. An explanation of the code can be found in the comments.

```javascript
import { ethers, BigNumber } from "ethers";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import Web3Modal from "web3modal";

import {
	NFT_CONTRACT_ABI,
	NFT_CONTRACT_ADDRESS,
	TOKEN_CONTRACT_ABI,
	TOKEN_CONTRACT_ADDRESS,
} from "../constants";

import styles from "../styles/Home.module.css";

const fetchContractNFT = (signerOrProvider) => {
	const contract = new ethers.Contract(
		NFT_CONTRACT_ADDRESS,
		NFT_CONTRACT_ABI,
		signerOrProvider
	);
	return contract;
};

const fetchContractTOKEN = (signerOrProvider) => {
	const contract = new ethers.Contract(
		TOKEN_CONTRACT_ADDRESS,
		TOKEN_CONTRACT_ABI,
		signerOrProvider
	);
	return contract;
};

export default function Home() {
	// Create a BigNumber `0`
	const zero = BigNumber.from(0);
	// walletConnected keeps track of whether the user's wallet is connected or not
	const [walletConnected, setWalletConnected] = useState(false);
	// loading is set to true when we are waiting for a transaction to get mined
	const [loading, setLoading] = useState(false);
	// tokensToBeClaimed keeps track of the number of tokens that can be claimed
	// based on the Crypto Dev NFT's held by the user for which they havent claimed the tokens
	const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
	// balanceOfCryptoDevTokens keeps track of number of Crypto Dev tokens owned by an address
	const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] =
		useState(zero);
	// amount of the tokens that the user wants to mint
	const [tokenAmount, setTokenAmount] = useState(zero);
	// tokensMinted is the total number of tokens that have been minted till now out of 10000(max total supply)
	const [tokensMinted, setTokensMinted] = useState(zero);
	// isOwner gets the owner of the contract through the signed address
	const [isOwner, setIsOwner] = useState(false);

	/**
	 * getTokensToBeClaimed: checks the balance of tokens that can be claimed by the user
	 */
	const getTokensToBeClaimed = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			// Create an instance of NFT Contract
			const nftContract = fetchContractNFT(provider);
			// Create an instance of tokenContract
			const tokenContract = fetchContractTOKEN(provider);
			// We will get the signer now to extract the address of the currently connected MetaMask account
			const signer = provider.getSigner();
			// Get the address associated to the signer which is connected to  MetaMask
			const address = await signer.getAddress();
			// call the balanceOf from the NFT contract to get the number of NFT's held by the user
			const balance = await nftContract.balanceOf(address);
			// balance is a Big number and thus we would compare it with Big number `zero`
			if (balance === zero) {
				setTokensToBeClaimed(zero);
			} else {
				// amount keeps track of the number of unclaimed tokens
				var amount = 0;
				// For all the NFT's, check if the tokens have already been claimed
				// Only increase the amount if the tokens have not been claimed
				// for a an NFT(for a given tokenId)
				for (var i = 0; i < balance; i++) {
					const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
					const claimed = await tokenContract.tokenIdsClaimed(tokenId);
					if (!claimed) {
						amount++;
					}
				}
				//tokensToBeClaimed has been initialized to a Big Number, thus we would convert amount
				// to a big number and then set its value
				setTokensToBeClaimed(BigNumber.from(amount));
			}
		} catch (err) {
			console.error(err);
			setTokensToBeClaimed(zero);
		}
	};

	/**
	 * getBalanceOfCryptoDevTokens: checks the balance of Crypto Dev Tokens's held by an address
	 */
	const getBalanceOfCryptoDevTokens = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			// Create an instance of token contract
			const tokenContract = fetchContractTOKEN(provider);
			// We will get the signer now to extract the address of the currently connected MetaMask account
			const signer = provider.getSigner();
			// Get the address associated to the signer which is connected to  MetaMask
			const address = await signer.getAddress();
			// call the balanceOf from the token contract to get the number of tokens held by the user
			const balance = await tokenContract.balanceOf(address);
			// balance is already a big number, so we dont need to convert it before setting it
			setBalanceOfCryptoDevTokens(balance);
		} catch (err) {
			console.error(err);
			setBalanceOfCryptoDevTokens(zero);
		}
	};

	/**
	 * mintCryptoDevToken: mints `amount` number of tokens to a given address
	 */
	const mintCryptoDevToken = async (amount) => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			const signer = provider.getSigner();
			// Create an instance of tokenContract
			const tokenContract = fetchContractTOKEN(signer);
			// Each token is of `0.001 ether`. The value we need to send is `0.001 * amount`
			const value = 0.001 * amount;
			const tx = await tokenContract.mint(amount, {
				// value signifies the cost of one crypto dev token which is "0.001" eth.
				// We are parsing `0.001` string to ether using the utils library from ethers.js
				value: ethers.utils.parseEther(value.toString()),
			});
			setLoading(true);
			// wait for the transaction to get mined
			await tx.wait();
			setLoading(false);
			window.alert("Successfully minted Crypto Dev Tokens");
			await getBalanceOfCryptoDevTokens();
			await getTotalTokensMinted();
			await getTokensToBeClaimed();
		} catch (err) {
			console.error(err);
		}
	};

	/**
	 * claimCryptoDevTokens: Helps the user claim Crypto Dev Tokens
	 */
	const claimCryptoDevTokens = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			const signer = provider.getSigner();
			// Create an instance of tokenContract
			const tokenContract = fetchContractTOKEN(signer);
			const tx = await tokenContract.claim();
			setLoading(true);
			// wait for the transaction to get mined
			await tx.wait();
			setLoading(false);
			window.alert("Sucessfully claimed Crypto Dev Tokens");
			await getBalanceOfCryptoDevTokens();
			await getTotalTokensMinted();
			await getTokensToBeClaimed();
		} catch (err) {
			console.error(err);
		}
	};

	/**
	 * getTotalTokensMinted: Retrieves how many tokens have been minted till now
	 * out of the total supply
	 */
	const getTotalTokensMinted = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			// Create an instance of token contract
			const tokenContract = fetchContractTOKEN(provider);
			// Get all the tokens that have been minted
			const _tokensMinted = await tokenContract.totalSupply();
			setTokensMinted(_tokensMinted);
		} catch (err) {
			console.error(err);
		}
	};

	/**
	 * getOwner: gets the contract owner by connected address
	 */
	const getOwner = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			const tokenContract = fetchContractTOKEN(provider);
			// call the owner function from the contract
			const _owner = await tokenContract.owner();
			// we get signer to extract address of currently connected Metamask account
			const signer = provider.getSigner();
			// Get the address associated to signer which is connected to Metamask
			const address = await signer.getAddress();
			if (address.toLowerCase() === _owner.toLowerCase()) {
				setIsOwner(true);
			}
		} catch (err) {
			console.error(err.message);
		}
	};

	/**
	 * withdrawCoins: withdraws ether by calling
	 * the withdraw function in the contract
	 */
	const withdrawCoins = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			const signer = provider.getSigner();
			const tokenContract = fetchContractTOKEN(signer);

			const tx = await tokenContract.withdraw();
			setLoading(true);
			await tx.wait();
			setLoading(false);
			await getOwner();
		} catch (err) {
			console.error(err);
			window.alert(err.reason);
		}
	};

	const connectWallet = async () => {
		try {
			if (!window.ethereum) return console.log("Install metamask");

			const accounts = await window.ethereum.request({
				method: "eth_requestAccounts",
			});

			console.log(accounts);
		} catch (error) {
			console.log(error);
		}
		setWalletConnected(true);
	};

	useEffect(() => {
		connectWallet();
		getTotalTokensMinted();
		getBalanceOfCryptoDevTokens();
		getTokensToBeClaimed();
		getOwner();
	}, [walletConnected]);

	/*
        renderButton: Returns a button based on the state of the dapp
      */
	const renderButton = () => {
		// If we are currently waiting for something, return a loading button
		if (loading) {
			return (
				<div>
					<button className={styles.button}>Loading...</button>
				</div>
			);
		}
		// If tokens to be claimed are greater than 0, Return a claim button
		if (tokensToBeClaimed > 0) {
			return (
				<div>
					<div className={styles.description}>
						{tokensToBeClaimed * 10} Tokens can be claimed!
					</div>
					<button className={styles.button} onClick={claimCryptoDevTokens}>
						Claim Tokens
					</button>
				</div>
			);
		}
		// If user doesn't have any tokens to claim, show the mint button
		return (
			<div style={{ display: "flex-col" }}>
				<div>
					<input
						type="number"
						placeholder="Amount of Tokens"
						// BigNumber.from converts the `e.target.value` to a BigNumber
						onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
						className={styles.input}
					/>
				</div>

				<button
					className={styles.button}
					disabled={!(tokenAmount > 0)}
					onClick={() => mintCryptoDevToken(tokenAmount)}>
					Mint Tokens
				</button>
			</div>
		);
	};

	return (
		<div>
			<Head>
				<title>Crypto Devs</title>
				<meta name="description" content="ICO-Dapp" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className={styles.main}>
				<div>
					<h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
					<div className={styles.description}>
						You can claim or mint Crypto Dev tokens here
					</div>
					{walletConnected ? (
						<div>
							<div className={styles.description}>
								{/* Format Ether helps us in converting a BigNumber to string */}
								You have minted {ethers.utils.formatEther(
									balanceOfCryptoDevTokens
								)} Crypto Dev Tokens
							</div>
							<div className={styles.description}>
								{/* Format Ether helps us in converting a BigNumber to string */}
								Overall {ethers.utils.formatEther(tokensMinted)}/10000 have been
								minted!!!
							</div>
							{renderButton()}
							{/* Display additional withdraw button if connected wallet is owner */}
							{isOwner ? (
								<div>
									{loading ? (
										<button className={styles.button}>Loading...</button>
									) : (
										<button className={styles.button} onClick={withdrawCoins}>
											Withdraw Coins
										</button>
									)}
								</div>
							) : (
								""
							)}
						</div>
					) : (
						<button onClick={connectWallet} className={styles.button}>
							Connect your wallet
						</button>
					)}
				</div>
				<div>
					<img className={styles.image} src="./0.svg" />
				</div>
			</div>

			<footer className={styles.footer}>
				Made with &#10084; by Crypto Devs
			</footer>
		</div>
	);
}
```

- Now create a new folder under the `my-app` folder and name it `constants`.
- In the `constants` folder create a file called `index.js` and paste the following code:

  ```js
  export const NFT_CONTRACT_ABI = "abi-of-your-nft-contract";
  export const NFT_CONTRACT_ADDRESS = "address-of-your-nft-contract";
  export const TOKEN_CONTRACT_ABI = "abi-of-your-token-contract";
  export const TOKEN_CONTRACT_ADDRESS = "address-of-your-token-contract";
  ```

  - Replace `"abi-of-your-nft-contract"` with the abi of the NFT contract that you deployed in the last tutorial.
  - Replace `"address-of-your-nft-contract"` with the address of the NFT contract that you deployed in your previous tutorial.
  - Replace `"abi-of-your-token-contract"` by the abi of the token contract. To get the abi of the Token contract, go to `hardhat-tutorial/artifacts/contracts/CryptoDevToken.sol` and then from`CryptoDevToken.json` file get the array marked under the `"abi"` key.
  - Replace `"address-of-your-token-contract"` with the address of the token contract that you saved to your notepad earlier in the tutorial.

- Now in your terminal which is pointing to `my-app` folder, execute the following:

  ```bash
  npm run dev
  ```

Your ICO dapp should now work without errors 🚀

## CONGRATULATIONS! You're all done!

Hopefully you enjoyed this tutorial. Don't forget to share your ICO website in the `#showcase` channel on Discord :D
