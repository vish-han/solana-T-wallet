const bip39 =require('bip39');
const Web3 =require('@solana/web3.js');
const { SOLANA_RPC_URL } =require( '../config');
const {add} = require("nodemon/lib/rules");

const web3 = new Web3.Connection(SOLANA_RPC_URL);

/**
 * Generates a new mnemonic phrase with an optional passphrase.
 * @param {string} passphrase - Optional passphrase for mnemonic encryption.
 * @returns {Promise<string>} - The generated mnemonic phrase.
 */
async function generateWalletMnemonic(passphrase = '') {
    try {
        const mnemonic = await bip39.generateMnemonic(undefined, undefined, passphrase);
        return mnemonic;
    } catch (error) {
        throw new Error(`Failed to generate mnemonic phrase: ${error.message}`);
    }
}
/**
 * Creates a Solana wallet from a mnemonic phrase.
 * @param {string} mnemonic - The mnemonic phrase.
 * @param {string} password - Optional passphrase for mnemonic decryption.
 * @returns {Promise<string>} - The public key of the created wallet.
 */
 async function createWallet(mnemonic, password = '') {
    try {
        const seed = await bip39.mnemonicToSeed(mnemonic, password);
        const keyPair = Web3.Keypair.fromSeed(seed.slice(0, 32));
        return keyPair.publicKey.toBase58();
    } catch (error) {
        throw new Error(`Failed to create wallet: ${error.message}`);
    }
}

/**
 * Retrieves the SOL balance for a given public key.
 * @param {string} publicKey - The public key of the wallet.
 * @returns {Promise<number>} - The SOL balance.
 */
async function getBalance(publicKey) {
    try {
        if (!Web3.PublicKey.isOnCurve(publicKey)) {
            throw new Error('Invalid public key');
        }

        const address = new Web3.PublicKey(publicKey);
        const balance = await web3.getBalance(address) / 10 ** 9
        return balance;
    } catch (error) {
        throw new Error(`Failed to retrieve balance: ${error.message}`);
    }
}
async function airDropSOL(recipientPublicKey) {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            const recipientAddress = new Web3.PublicKey(recipientPublicKey);
            const signature = await web3.requestAirdrop(recipientAddress, 10000);
            await web3.confirmTransaction(signature);
            return; // Airdrop successful, exit the function
        } catch (error) {
            console.error('Failed to airdrop SOL:', error);
            if (error.statusCode === 429) {
                const delay = Math.pow(2, retries) * 1000; // Exponential backoff
                console.log(`Retrying after ${delay}ms delay...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                retries++;
            } else {
                throw new Error(`Failed to airdrop SOL: ${error.message}`);
            }
        }
    }

    throw new Error('Failed to airdrop SOL: Max retries exceeded');
}

async function verifyMnemonic(mnemonic, walletAddress) {
    try {
        const seed = await bip39.mnemonicToSeed(mnemonic);
        const keyPair = Web3.Keypair.fromSeed(seed.slice(0, 32));
        const generatedAddress = keyPair.publicKey.toBase58();
        return generatedAddress === walletAddress;
    } catch (error) {
        console.error('Error verifying mnemonic:', error);
        return false; // Return false in case of any errors
    }
}


module.exports = {getBalance,createWallet,generateWalletMnemonic,airDropSOL,verifyMnemonic};