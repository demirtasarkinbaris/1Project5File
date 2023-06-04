import { useEffect, useState } from "react";
import { ethers } from "ethers";
import styles from "../styles/Home.module.css";
import Head from "next/head";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants/index";

const fetchContract = (signerOrProvider) => {
	const contract = new ethers.Contract(
		NFT_CONTRACT_ADDRESS,
		abi,
		signerOrProvider
	);
	return contract;
};

export default function Home() {
	const [walletConnected, setWalletConnected] = useState(false);
	const [presaleStarted, setPresaleStarted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [isOwner, setIsOwner] = useState(false);
	const [presaleEnded, setPresaleEnded] = useState(false);
	const [tokenIdsMinted, setTokenIdsMinted] = useState("0");

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

	const startPresale = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			const signer = provider.getSigner();
			const contract = fetchContract(signer);

			const tx = await contract.startPresale();
			setLoading(true);
			// wait for the transaction to get mined
			await tx.wait();
			setLoading(false);
			// set the presale started to true
			await checkIfPresaleStarted();
		} catch (err) {
			console.error(err);
		}
	};

	const checkIfPresaleStarted = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			const contract = fetchContract(provider);

			const _presaleStarted = await contract.presaleStarted();
			if (!_presaleStarted) {
				await getOwner();
			}
			setPresaleStarted(_presaleStarted);
			return _presaleStarted;
		} catch (err) {
			console.error(err);
			return false;
		}
	};

	const checkIfPresaleEnded = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			const contract = fetchContract(provider);

			const _presaleEnded = await contract.presaleEnded();

			const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
			if (hasEnded) {
				setPresaleEnded(true);
			} else {
				setPresaleEnded(false);
			}
			return hasEnded;
		} catch (err) {
			console.error(err);
			return false;
		}
	};

	const getOwner = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			const contract = fetchContract(provider);
			const _owner = await contract.owner();
			// We will get the signer now to extract the address of the currently connected MetaMask account

			const provider2 = new ethers.providers.Web3Provider(connection);
			const signer = provider2.getSigner();
			// Get the address associated to the signer which is connected to  MetaMask
			const address = await signer.getAddress();
			if (address.toLowerCase() === _owner.toLowerCase()) {
				setIsOwner(true);
			}
		} catch (err) {
			console.error(err.message);
		}
	};

	const presaleMint = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			const signer = provider.getSigner();
			const contract = fetchContract(signer);
			console.log(contract);
			const tx = await contract.presaleMint({
				value: ethers.utils.parseEther("0.01"),
			});
			setLoading(true);
			// wait for the transaction to get mined
			await tx.wait();
			setLoading(false);
			window.alert("You successfully minted a Crypto Dev!");
		} catch (err) {
			console.error(err);
		}
	};

	const publicMint = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			const signer = provider.getSigner();
			const contract = fetchContract(signer);
			const tx = await contract.mint({
				value: ethers.utils.parseEther("0.01"),
			});
			setLoading(true);
			// wait for the transaction to get mined
			await tx.wait();
			setLoading(false);
			window.alert("You successfully minted a Crypto Dev!");
		} catch (err) {
			console.error(err);
		}
	};

	const getTokenIdsMinted = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			const contract = fetchContract(provider);

			// call the tokenIds from the contract
			const _tokenIds = await contract.tokenIds();

			setTokenIdsMinted(_tokenIds.toString());
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		connectWallet();

		const _presaleStarted = checkIfPresaleStarted();
		if (_presaleStarted) {
			checkIfPresaleEnded();
		}

		getTokenIdsMinted();

		setInterval(async function () {
			await getTokenIdsMinted();
		}, 5 * 1000);

		const presaleEndedInterval = setInterval(async function () {
			const _presaleStarted = await checkIfPresaleStarted();
			if (_presaleStarted) {
				const _presaleEnded = await checkIfPresaleEnded();
				if (_presaleEnded) {
					clearInterval(presaleEndedInterval);
				}
			}
		}, 5 * 1000);
	}, [walletConnected]);

	const renderButton = () => {
		// If wallet is not connected, return a button which allows them to connect their wallet
		if (!walletConnected) {
			return (
				<button onClick={connectWallet} className={styles.button}>
					Connect your wallet
				</button>
			);
		}

		// If we are currently waiting for something, return a loading button
		if (loading) {
			return <button className={styles.button}>Loading...</button>;
		}

		// If connected user is the owner, and presale hasn't started yet, allow them to start the presale
		if (isOwner && !presaleStarted) {
			return (
				<button className={styles.button} onClick={startPresale}>
					Start Presale!
				</button>
			);
		}

		// If connected user is not the owner but presale hasn't started yet, tell them that
		if (!presaleStarted) {
			return (
				<div>
					<div className={styles.description}>Presale hasn&#39;t started!</div>
				</div>
			);
		}

		// If presale started, but hasn't ended yet, allow for minting during the presale period
		if (presaleStarted && !presaleEnded) {
			return (
				<div>
					<div className={styles.description}>
						Presale has started!!! If your address is whitelisted, Mint a Crypto
						Dev 🥳
					</div>
					<button className={styles.button} onClick={presaleMint}>
						Presale Mint 🚀
					</button>
				</div>
			);
		}

		// If presale started and has ended, it's time for public minting
		if (presaleStarted && presaleEnded) {
			return (
				<button className={styles.button} onClick={publicMint}>
					Public Mint 🚀
				</button>
			);
		}
	};

	return (
		<div>
			<Head>
				<title>Crypto Devs</title>
				<meta name="description" content="Whitelist-Dapp" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div className={styles.main}>
				<div>
					<h1 className={styles.title}>Welcome to Crypto Devs!</h1>
					<div className={styles.description}>
						It&#39;s an NFT collection for developers in Crypto.
					</div>
					<div className={styles.description}>
						{tokenIdsMinted}/20 have been minted
					</div>
					{renderButton()}
				</div>
				<div>
					<img className={styles.image} src="./cryptodevs/0.svg" />
				</div>
			</div>

			<footer className={styles.footer}>
				Made with &#10084; by Crypto Devs
			</footer>
		</div>
	);
}
