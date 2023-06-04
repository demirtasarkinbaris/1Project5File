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
								You have minted{" "}
								{ethers.utils.formatEther(balanceOfCryptoDevTokens)} Crypto Dev
								Tokens
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
