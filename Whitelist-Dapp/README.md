# Whitelist-Dapp

You are launching your NFT collection named `Crypto Devs`. You want to give your early supporters access to a whitelist for your collection, so here you are creating a whitelist dapp for `Crypto Devs`

![](https://i.imgur.com/zgY0TGo.png)

## Requirements

- Whitelist access should be given to the first `10` users for free who want to get in.
- There should be a website where people can go and enter into the whitelist.

Lets start building 🚀

---

## Prerequisites

- You can write code in JavaScript
- Have set up a Metamask Wallet
- Your computer has Node.js installed. If not download from [here](https://nodejs.org/en/download/)

### Smart Contract

To build the smart contract we will be using [Hardhat](https://hardhat.org/).
Hardhat is an Ethereum development environment and framework designed for full stack development in Solidity. In simple words you can write your smart contract, deploy them, run tests, and debug your code.

- First, you need to create a Whitelist-Daap folder where the Hardhat project and your Next.js app will later go
- Open up a terminal and execute these commands

```bash
mkdir Whitelist-Dapp
cd Whitelist-Dapp
```

- Then, in Whitelist-Daap folder, you will set up Hardhat project

```bash
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

If you are not on mac, please do this extra step and install these libraries as well :)

```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

- Start by creating a new file inside the `contracts` directory called `Whitelist.sol`.

  ```go
  //SPDX-License-Identifier: Unlicense
  pragma solidity ^0.8.0;


  contract Whitelist {

      // Max number of whitelisted addresses allowed
      uint8 public maxWhitelistedAddresses;

      // Create a mapping of whitelistedAddresses
      // if an address is whitelisted, we would set it to true, it is false by default for all other addresses.
      mapping(address => bool) public whitelistedAddresses;

      // numAddressesWhitelisted would be used to keep track of how many addresses have been whitelisted
      // NOTE: Don't change this variable name, as it will be part of verification
      uint8 public numAddressesWhitelisted;

      // Setting the Max number of whitelisted addresses
      // User will put the value at the time of deployment
      constructor(uint8 _maxWhitelistedAddresses) {
          maxWhitelistedAddresses =  _maxWhitelistedAddresses;
      }

      /**
          addAddressToWhitelist - This function adds the address of the sender to the
          whitelist
       */
      function addAddressToWhitelist() public {
          // check if the user has already been whitelisted
          require(!whitelistedAddresses[msg.sender], "Sender has already been whitelisted");
          // check if the numAddressesWhitelisted < maxWhitelistedAddresses, if not then throw an error.
          require(numAddressesWhitelisted < maxWhitelistedAddresses, "More addresses cant be added, limit reached");
          // Add the address which called the function to the whitelistedAddress array
          whitelistedAddresses[msg.sender] = true;
          // Increase the number of whitelisted addresses
          numAddressesWhitelisted += 1;
      }

  }
  ```

- Lets deploy the contract to `mumbai` network. Create a new file, or replace the default file named `deploy.js` under the `scripts` folder

- Now we will write some code to deploy the contract in `deploy.js` file.

  ```js
  const { ethers } = require("hardhat");

  async function main() {
  	/*
    A ContractFactory in ethers.js is an abstraction used to deploy new smart contracts,
    so whitelistContract here is a factory for instances of our Whitelist contract.
    */
  	const whitelistContract = await ethers.getContractFactory("Whitelist");

  	// here we deploy the contract
  	const deployedWhitelistContract = await whitelistContract.deploy(10);
  	// 10 is the Maximum number of whitelisted addresses allowed

  	// Wait for it to finish deploying
  	await deployedWhitelistContract.deployed();

  	// print the address of the deployed contract
  	console.log(
  		"Whitelist Contract Address:",
  		deployedWhitelistContract.address
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

- Now create a `.env` file in the `hardhat-tutorial` folder and add the following lines, use the instructions in the comments to get your Alchemy API Key URL and Private Key. Make sure that the account from which you get your private key is funded with Mumbai.

  ```

  // Go to https://www.alchemyapi.io, sign up, create
  // a new App in its dashboard and select the network as Mumbai, and replace "add-the-alchemy-key-url-here" with its key url
  ALCHEMY_API_KEY_URL="add-the-alchemy-key-url-here"

  // Replace this private key with your Metamask account private key
  // To export your private key from Metamask, open Metamask and
  // go to Account Details > Export Private Key
  // Be aware of NEVER putting real Ether into testing accounts
  PRIVATE_KEY="add-the-account-private-key-here"

  ```

- Now we will install `dotenv` package to be able to import the env file and use it in our config. Open up a terminal pointing at`hardhat-tutorial` directory and execute this command
  ```bash
  npm install dotenv
  ```
- Now open the hardhat.config.js file, we would add the `mumbai` network here so that we can deploy our contract to mumbai. Replace all the lines in the `hardhar.config.js` file with the given below lines

  ```js
  require("@nomicfoundation/hardhat-toolbox");
  require("dotenv").config({ path: ".env" });

  const ALCHEMY_API_KEY_URL = process.env.ALCHEMY_API_KEY_URL;

  const PRIVATE_KEY = process.env.PRIVATE_KEY;

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

- Compile the contract, open up a terminal pointing at`hardhat-tutorial` directory and execute this command

  ```bash
     npx hardhat compile
  ```

- To deploy, open up a terminal pointing at`hardhat-tutorial` directory and execute this command
  ```bash
  npx hardhat run scripts/deploy.js --network mumbai
  ```
- Save the Whitelist Contract Address that was printed on your terminal in your notepad, you would need it futher down in the tutorial.

### Website

- To develop the website we will use [React](https://reactjs.org/) and [Next Js](https://nextjs.org/). React is a javascript framework used to make websites and Next.js is a React framework that also allows writing backend APIs code along with the frontend, so you don't need two separate frontend and backend services.
- First, You will need to create a new `next` app.

- To create this `next-app`, in the terminal point to Whitelist-Dapp folder and type

  ```bash
  npx create-next-app@latest
  ```

  and press `enter` for all the questions

- Your folder structure should look something like

  ```
  - Whitelist-Dapp
      - hardhat-tutorial
      - my-app
  ```

- Now to run the app, execute these commands in the terminal

  ```
  cd my-app
  npm run dev
  ```

- Now go to `http://localhost:3000`, your app should be running 🤘

- Now lets install [Web3Modal library](https://github.com/Web3Modal/web3modal). Web3Modal is an easy to use library to help developers easily allow their users to connect to your dApps with all sorts of different wallets. By default Web3Modal Library supports injected providers like (Metamask, Dapper, Gnosis Safe, Frame, Web3 Browsers, etc) and WalletConnect, You can also easily configure the library to support Portis, Fortmatic, Squarelink, Torus, Authereum, D'CENT Wallet and Arkane.
  (Here's a live example on [Codesandbox.io](https://codesandbox.io/s/j43b10))

- Open up a terminal pointing at`my-app` directory and execute this command

  ```bash
  npm install web3modal
  ```

- In the same terminal also install `ethers.js`

  ```bash
  npm install ethers
  ```

- In your my-app/public folder, download [this image](https://github.com/demirtasarkinbaris/Whitelist-DApp/blob/main/my-app/public/crypto-devs.svg) and rename it to `crypto-devs.svg`
- Now go to styles folder and replace all the contents of `Home.modules.css` file with the following code, this would add some styling to your dapp:

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
  	padding: 20px;
  	width: 200px;
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

- Open your index.js file under the pages folder and paste the following code, explanation of the code can be found in the comments. Make sure you read about React and [React Hooks](https://reactjs.org/docs/hooks-overview.html), [React Hooks Tutorial](https://www.w3schools.com/react/react_hooks.asp) if you are not familiar with them.

  ```js
  import Head from "next/head";
  import styles from "@/styles/Home.module.css";
  import Web3Modal from "web3modal";
  import { ethers } from "ethers";
  import { useEffect, useState } from "react";
  import { WHITELIST_CONTRACT_ADDRESS, abi } from "../../constants/index";

  const fetchContract = (signerOrProvider) => {
  	const contract = new ethers.Contract(
  		WHITELIST_CONTRACT_ADDRESS,
  		abi,
  		signerOrProvider
  	);
  	return contract;
  };

  export default function Home() {
  	// walletConnected keep track of whether the user's wallet is connected or not
  	const [walletConnected, setWalletConnected] = useState(false);
  	// joinedWhitelist keeps track of whether the current metamask address has joined the Whitelist or not
  	const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  	// loading is set to true when we are waiting for a transaction to get mined
  	const [loading, setLoading] = useState(false);
  	// numberOfWhitelisted tracks the number of addresses's whitelisted
  	const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);

  	const [currentUser, setCurrentUser] = useState("");

  	/**
  	 * addAddressToWhitelist: Adds the current connected address to the whitelist
  	 */
  	const addAddressToWhitelist = async () => {
  		try {
  			const web3modal = new Web3Modal();
  			const connection = await web3modal.connect();
  			const provider = new ethers.providers.Web3Provider(connection);
  			const signer = provider.getSigner();
  			const contract = fetchContract(signer);
  			// call the addAddressToWhitelist from the contract
  			const tx = await contract.addAddressToWhitelist();
  			setLoading(true);
  			// wait for the transaction to get mined
  			await tx.wait();
  			setLoading(false);
  			// get the updated number of addresses in the whitelist
  			await getNumberOfWhitelisted();
  			setJoinedWhitelist(true);
  		} catch (err) {
  			console.error(err);
  		}
  	};

  	/**
  	 * getNumberOfWhitelisted:  gets the number of whitelisted addresses
  	 */
  	const getNumberOfWhitelisted = async () => {
  		try {
  			const web3modal = new Web3Modal();
  			const connection = await web3modal.connect();
  			const provider = new ethers.providers.Web3Provider(connection);
  			const contract = fetchContract(provider);
  			// call the numAddressesWhitelisted from the contract
  			const _numberOfWhitelisted = await contract.numAddressesWhitelisted();
  			setNumberOfWhitelisted(_numberOfWhitelisted);
  		} catch (err) {
  			console.error(err);
  		}
  	};

  	/**
  	 * checkIfAddressInWhitelist: Checks if the address is in whitelist
  	 */
  	const checkIfAddressInWhitelist = async () => {
  		try {
  			// We will need the signer later to get the user's address
  			// Even though it is a read transaction, since Signers are just special kinds of Providers,
  			// We can use it in it's place
  			const web3modal = new Web3Modal();
  			const connection = await web3modal.connect();
  			const provider = new ethers.providers.Web3Provider(connection);
  			const signer = provider.getSigner();
  			const contract = fetchContract(signer);
  			// Get the address associated to the signer which is connected to  MetaMask
  			const address = await signer.getAddress();
  			// call the whitelistedAddresses from the contract
  			const _joinedWhitelist = await contract.whitelistedAddresses(address);
  			setJoinedWhitelist(_joinedWhitelist);
  		} catch (err) {
  			console.error(err);
  		}
  	};

  	/*
      connectWallet: Connects the MetaMask wallet
    */

  	const connectWallet = async () => {
  		try {
  			if (!window.ethereum) return "install metamask!";

  			const accounts = await window.ethereum.request({
  				method: "eth_requestAccounts",
  			});

  			setCurrentUser(accounts[0]);
  			setWalletConnected(true);
  		} catch (error) {
  			console.log(error);
  		}
  	};

  	// useEffects are used to react to changes in state of the website
  	// The array at the end of function call represents what state changes will trigger this effect
  	// In this case, whenever the value of `walletConnected` changes - this effect will be called
  	useEffect(() => {
  		connectWallet();
  		checkIfAddressInWhitelist();
  		getNumberOfWhitelisted();
  	}, [walletConnected]);

  	/*
      renderButton: Returns a button based on the state of the dapp
    */
  	const renderButton = () => {
  		if (walletConnected) {
  			if (joinedWhitelist) {
  				return (
  					<div className={styles.description}>
  						Thanks for joining the Whitelist!
  					</div>
  				);
  			} else if (loading) {
  				return <button className={styles.button}>Loading...</button>;
  			} else {
  				return (
  					<button onClick={addAddressToWhitelist} className={styles.button}>
  						Join the Whitelist
  					</button>
  				);
  			}
  		} else {
  			return (
  				<button onClick={connectWallet} className={styles.button}>
  					Connect your wallet
  				</button>
  			);
  		}
  	};

  	return (
  		<div>
  			<Head>
  				<title>Whitelist Dapp</title>
  				<meta name="description" content="Whitelist-Dapp" />
  				<link rel="icon" href="/favicon.ico" />
  			</Head>
  			<div className={styles.main}>
  				<div>
  					<h1 className={styles.title}>Welcome to Crypto Devs!</h1>
  					<div className={styles.description}>
  						{/* Using HTML Entities for the apostrophe */}
  						It&#39;s an NFT collection for developers in Crypto.
  					</div>
  					<div className={styles.description}>
  						{numberOfWhitelisted} have already joined the Whitelist
  					</div>
  					{renderButton()}
  				</div>
  				<div>
  					<img className={styles.image} src="./crypto-devs.svg" />
  				</div>
  			</div>

  			<footer className={styles.footer}>
  				Made with &#10084; by Crypto Devs
  			</footer>
  		</div>
  	);
  }
  ```

- Now create a new folder under the my-app folder and name it `constants`.
- In the constants folder create a file, `index.js` and paste the following code.

  ```js
  export const WHITELIST_CONTRACT_ADDRESS = "YOUR_WHITELIST_CONTRACT_ADDRESS";
  export const abi = YOUR_ABI;
  ```

- Replace `"YOUR_WHITELIST_CONTRACT_ADDRESS"` with the address of the whitelist contract that you deployed.
- Replace `"YOUR_ABI"` with the ABI of your Whitelist Contract. To get the ABI for your contract, go to your `hardhat-tutorial/artifacts/contracts/Whitelist.sol` folder and from your `Whitelist.json` file get the array marked under the `"abi"` key (it will be. a huge array, close to 100 lines if not more).

- Now in your terminal which is pointing to `my-app` folder, execute

  ```bash
  npm run dev
  ```

Your whitelist dapp should now work without errors 🚀
