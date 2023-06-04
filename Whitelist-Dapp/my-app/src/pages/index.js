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
