import { ethers } from "ethers";
import {
	EXCHANGE_CONTRACT_ABI,
	EXCHANGE_CONTRACT_ADDRESS,
	TOKEN_CONTRACT_ABI,
	TOKEN_CONTRACT_ADDRESS,
} from "../constants";

export const getEtherBalance = async (provider, address, contract = false) => {
	try {
		// If the caller has set the `contract` boolean to true, retrieve the balance of
		// ether in the `exchange contract`, if it is set to false, retrieve the balance
		// of the user's address
		if (contract) {
			const balance = await provider.getBalance(EXCHANGE_CONTRACT_ADDRESS);
			return balance;
		} else {
			const balance = await provider.getBalance(address);
			return balance;
		}
	} catch (err) {
		console.error(err);
		return 0;
	}
};

const fetchContractEXC = (signerOrProvider) => {
	const contract = new ethers.Contract(
		EXCHANGE_CONTRACT_ADDRESS,
		EXCHANGE_CONTRACT_ABI,
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
/**
 * getCDTokensBalance: Retrieves the Crypto Dev tokens in the account
 * of the provided `address`
 */
export const getCDTokensBalance = async (provider, address) => {
	try {
		const tokenContract = fetchContractTOKEN(provider);
		const balanceOfCryptoDevTokens = await tokenContract.balanceOf(address);
		return balanceOfCryptoDevTokens;
	} catch (err) {
		console.error(err);
	}
};

/**
 * getLPTokensBalance: Retrieves the amount of LP tokens in the account
 * of the provided `address`
 */
export const getLPTokensBalance = async (provider, address) => {
	try {
		const exchangeContract = fetchContractEXC(provider);
		const balanceOfLPTokens = await exchangeContract.balanceOf(address);
		return balanceOfLPTokens;
	} catch (err) {
		console.error(err);
	}
};

/**
 * getReserveOfCDTokens: Retrieves the amount of CD tokens in the
 * exchange contract address
 */
export const getReserveOfCDTokens = async (provider) => {
	try {
		const exchangeContract = fetchContractEXC(provider);
		const reserve = await exchangeContract.getReserve();
		return reserve;
	} catch (err) {
		console.error(err);
	}
};
