import { BigNumber, ethers } from "ethers";
import Head from "next/head";
import React, { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { addLiquidity, calculateCD } from "../utils/addLiquidity";
import {
	getCDTokensBalance,
	getEtherBalance,
	getLPTokensBalance,
	getReserveOfCDTokens,
} from "../utils/getAmounts";
import {
	getTokensAfterRemove,
	removeLiquidity,
} from "../utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../utils/swap";

export default function Home() {
	const [loading, setLoading] = useState(false);
	const [liquidityTab, setLiquidityTab] = useState(true);
	const zero = BigNumber.from(0);
	const [ethBalance, setEtherBalance] = useState(zero);
	const [reservedCD, setReservedCD] = useState(zero);
	const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
	const [cdBalance, setCDBalance] = useState(zero);
	const [lpBalance, setLPBalance] = useState(zero);
	const [addEther, setAddEther] = useState(zero);
	const [addCDTokens, setAddCDTokens] = useState(zero);
	const [removeEther, setRemoveEther] = useState(zero);
	const [removeCD, setRemoveCD] = useState(zero);
	const [removeLPTokens, setRemoveLPTokens] = useState("0");
	const [swapAmount, setSwapAmount] = useState("");
	const [tokenToBeReceivedAfterSwap, settokenToBeReceivedAfterSwap] =
		useState(zero);
	const [ethSelected, setEthSelected] = useState(true);
	const [walletConnected, setWalletConnected] = useState(false);

	const getAmounts = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			const signer = provider.getSigner();
			const address = await signer.getAddress();
			// get the amount of eth in the user's account
			const _ethBalance = await getEtherBalance(provider, address);
			// get the amount of `Crypto Dev` tokens held by the user
			const _cdBalance = await getCDTokensBalance(provider, address);
			// get the amount of `Crypto Dev` LP tokens held by the user
			const _lpBalance = await getLPTokensBalance(provider, address);
			// gets the amount of `CD` tokens that are present in the reserve of the `Exchange contract`
			const _reservedCD = await getReserveOfCDTokens(provider);
			// Get the ether reserves in the contract
			const _ethBalanceContract = await getEtherBalance(provider, null, true);
			setEtherBalance(_ethBalance);
			setCDBalance(_cdBalance);
			setLPBalance(_lpBalance);
			setReservedCD(_reservedCD);
			setReservedCD(_reservedCD);
			setEtherBalanceContract(_ethBalanceContract);
		} catch (err) {
			console.error(err);
		}
	};

	/**
	 * swapTokens: Swaps  `swapAmountWei` of Eth/Crypto Dev tokens with `tokenToBeReceivedAfterSwap` amount of Eth/Crypto Dev tokens.
	 */
	const _swapTokens = async () => {
		try {
			// Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
			const swapAmountWei = ethers.utils.parseEther(swapAmount);
			// Check if the user entered zero
			// We are here using the `eq` method from BigNumber class in `ethers.js`
			if (!swapAmountWei.eq(zero)) {
				const web3Modal = new Web3Modal();
				const connection = await web3Modal.connect();
				const provider = new ethers.providers.Web3Provider(connection);
				const signer = provider.getSigner();
				setLoading(true);
				// Call the swapTokens function from the `utils` folder
				await swapTokens(
					signer,
					swapAmountWei,
					tokenToBeReceivedAfterSwap,
					ethSelected
				);
				setLoading(false);
				// Get all the updated amounts after the swap
				await getAmounts();
				setSwapAmount("");
			}
		} catch (err) {
			console.error(err);
			setLoading(false);
			setSwapAmount("");
		}
	};

	/**
	 * _getAmountOfTokensReceivedFromSwap:  Returns the number of Eth/Crypto Dev tokens that can be received
	 * when the user swaps `_swapAmountWEI` amount of Eth/Crypto Dev tokens.
	 */
	const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
		try {
			// Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
			const _swapAmountWEI = ethers.utils.parseEther(_swapAmount.toString());
			// Check if the user entered zero
			// We are here using the `eq` method from BigNumber class in `ethers.js`
			if (!_swapAmountWEI.eq(zero)) {
				const web3Modal = new Web3Modal();
				const connection = await web3Modal.connect();
				const provider = new ethers.providers.Web3Provider(connection);
				// Get the amount of ether in the contract
				const _ethBalance = await getEtherBalance(provider, null, true);
				// Call the `getAmountOfTokensReceivedFromSwap` from the utils folder
				const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
					_swapAmountWEI,
					provider,
					ethSelected,
					_ethBalance,
					reservedCD
				);
				settokenToBeReceivedAfterSwap(amountOfTokens);
			} else {
				settokenToBeReceivedAfterSwap(zero);
			}
		} catch (err) {
			console.error(err);
		}
	};

	/**
	 * _addLiquidity helps add liquidity to the exchange,
	 * If the user is adding initial liquidity, user decides the ether and CD tokens he wants to add
	 * to the exchange. If he is adding the liquidity after the initial liquidity has already been added
	 * then we calculate the crypto dev tokens he can add, given the Eth he wants to add by keeping the ratios
	 * constant
	 */
	const _addLiquidity = async () => {
		try {
			// Convert the ether amount entered by the user to Bignumber
			const addEtherWei = ethers.utils.parseEther(addEther.toString());
			// Check if the values are zero
			if (!addCDTokens.eq(zero) && !addEtherWei.eq(zero)) {
				const web3Modal = new Web3Modal();
				const connection = await web3Modal.connect();
				const provider = new ethers.providers.Web3Provider(connection);
				const signer = provider.getSigner();
				setLoading(true);
				// call the addLiquidity function from the utils folder
				await addLiquidity(signer, addCDTokens, addEtherWei);
				setLoading(false);
				// Reinitialize the CD tokens
				setAddCDTokens(zero);
				// Get amounts for all values after the liquidity has been added
				await getAmounts();
			} else {
				setAddCDTokens(zero);
			}
		} catch (err) {
			console.error(err);
			setLoading(false);
			setAddCDTokens(zero);
		}
	};

	const _removeLiquidity = async () => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			const signer = provider.getSigner();
			// Convert the LP tokens entered by the user to a BigNumber
			const removeLPTokensWei = ethers.utils.parseEther(removeLPTokens);
			setLoading(true);
			// Call the removeLiquidity function from the `utils` folder
			await removeLiquidity(signer, removeLPTokensWei);
			setLoading(false);
			await getAmounts();
			setRemoveCD(zero);
			setRemoveEther(zero);
		} catch (err) {
			console.error(err);
			setLoading(false);
			setRemoveCD(zero);
			setRemoveEther(zero);
		}
	};

	const _getTokensAfterRemove = async (_removeLPTokens) => {
		try {
			const web3Modal = new Web3Modal();
			const connection = await web3Modal.connect();
			const provider = new ethers.providers.Web3Provider(connection);
			// Convert the LP tokens entered by the user to a BigNumber
			const removeLPTokenWei = ethers.utils.parseEther(_removeLPTokens);
			// Get the Eth reserves within the exchange contract
			const _ethBalance = await getEtherBalance(provider, null, true);
			// get the crypto dev token reserves from the contract
			const cryptoDevTokenReserve = await getReserveOfCDTokens(provider);
			// call the getTokensAfterRemove from the utils folder
			const { _removeEther, _removeCD } = await getTokensAfterRemove(
				provider,
				removeLPTokenWei,
				_ethBalance,
				cryptoDevTokenReserve
			);
			setRemoveEther(_removeEther);
			setRemoveCD(_removeCD);
		} catch (err) {
			console.error(err);
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
		getAmounts();
	}, [walletConnected]);

	const renderButton = () => {
		// If wallet is not connected, return a button which allows them to connect their wllet
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

		if (liquidityTab) {
			return (
				<div>
					<div className={styles.description}>
						You have:
						<br />
						{/* Convert the BigNumber to string using the formatEther function from ethers.js */}
						{ethers.utils.formatEther(cdBalance)} Crypto Dev Tokens
						<br />
						{ethers.utils.formatEther(ethBalance)} Ether
						<br />
						{ethers.utils.formatEther(lpBalance)} Crypto Dev LP tokens
					</div>
					<div>
						{/* If reserved CD is zero, render the state for liquidity zero where we ask the user
                how much initial liquidity he wants to add else just render the state where liquidity is not zero and
                we calculate based on the `Eth` amount specified by the user how much `CD` tokens can be added */}
						{ethers.utils.parseEther(reservedCD.toString()).eq(zero) ? (
							<div>
								<input
									type="number"
									placeholder="Amount of Ether"
									onChange={(e) => setAddEther(e.target.value || "0")}
									className={styles.input}
								/>
								<input
									type="number"
									placeholder="Amount of CryptoDev tokens"
									onChange={(e) =>
										setAddCDTokens(
											BigNumber.from(
												ethers.utils.parseEther(e.target.value || "0")
											)
										)
									}
									className={styles.input}
								/>
								<button className={styles.button1} onClick={_addLiquidity}>
									Add
								</button>
							</div>
						) : (
							<div>
								<input
									type="number"
									placeholder="Amount of Ether"
									onChange={async (e) => {
										setAddEther(e.target.value || "0");
										// calculate the number of CD tokens that
										// can be added given  `e.target.value` amount of Eth
										const _addCDTokens = await calculateCD(
											e.target.value || "0",
											etherBalanceContract,
											reservedCD
										);
										setAddCDTokens(_addCDTokens);
									}}
									className={styles.input}
								/>
								<div className={styles.inputDiv}>
									{/* Convert the BigNumber to string using the formatEther function from ethers.js */}
									{`You will need ${ethers.utils.formatEther(
										addCDTokens
									)} Crypto Dev
                      Tokens`}
								</div>
								<button className={styles.button1} onClick={_addLiquidity}>
									Add
								</button>
							</div>
						)}
						<div>
							<input
								type="number"
								placeholder="Amount of LP Tokens"
								onChange={async (e) => {
									setRemoveLPTokens(e.target.value || "0");
									// Calculate the amount of Ether and CD tokens that the user would receive
									// After he removes `e.target.value` amount of `LP` tokens
									await _getTokensAfterRemove(e.target.value || "0");
								}}
								className={styles.input}
							/>
							<div className={styles.inputDiv}>
								{/* Convert the BigNumber to string using the formatEther function from ethers.js */}
								{`You will get ${ethers.utils.formatEther(removeCD)} Crypto
                  Dev Tokens and ${ethers.utils.formatEther(removeEther)} Eth`}
							</div>
							<button className={styles.button1} onClick={_removeLiquidity}>
								Remove
							</button>
						</div>
					</div>
				</div>
			);
		} else {
			return (
				<div>
					<input
						type="number"
						placeholder="Amount"
						onChange={async (e) => {
							setSwapAmount(e.target.value || "");
							// Calculate the amount of tokens user would receive after the swap
							await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
						}}
						className={styles.input}
						value={swapAmount}
					/>
					<select
						className={styles.select}
						name="dropdown"
						id="dropdown"
						onChange={async () => {
							setEthSelected(!ethSelected);
							// Initialize the values back to zero
							await _getAmountOfTokensReceivedFromSwap(0);
							setSwapAmount("");
						}}>
						<option value="eth">Ethereum</option>
						<option value="cryptoDevToken">Crypto Dev Token</option>
					</select>
					<br />
					<div className={styles.inputDiv}>
						{/* Convert the BigNumber to string using the formatEther function from ethers.js */}
						{ethSelected
							? `You will get ${ethers.utils.formatEther(
									tokenToBeReceivedAfterSwap
							  )} Crypto Dev Tokens`
							: `You will get ${ethers.utils.formatEther(
									tokenToBeReceivedAfterSwap
							  )} Eth`}
					</div>
					<button className={styles.button1} onClick={_swapTokens}>
						Swap
					</button>
				</div>
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
					<h1 className={styles.title}>Welcome to Crypto Devs Exchange!</h1>
					<div className={styles.description}>
						Exchange Ethereum &#60;&#62; Crypto Dev Tokens
					</div>
					<div>
						<button
							className={styles.button}
							onClick={() => {
								setLiquidityTab(true);
							}}>
							Liquidity
						</button>
						<button
							className={styles.button}
							onClick={() => {
								setLiquidityTab(false);
							}}>
							Swap
						</button>
					</div>
					{renderButton()}
				</div>
				<div>
					<img className={styles.image} src="./cryptodev.svg" />
				</div>
			</div>

			<footer className={styles.footer}>
				Made with &#10084; by Crypto Devs
			</footer>
		</div>
	);
}
