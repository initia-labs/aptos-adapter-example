import { InitiaConfig } from './client';
import {
  AccountAddressInput,
  AccountData,
  AnyNumber,
  Block,
  HexInput,
  InputGenerateTransactionOptions,
  LedgerInfo,
  LedgerVersionArg,
  MoveModule,
  MoveModuleBytecode,
  MoveResource,
  MoveStructId,
  MoveValue,
  PaginationArgs,
  TransactionResponse,
} from '@aptos-labs/ts-sdk';
import {
  AccAddress,
  AuthInfo,
  BaseAccount,
  Coins,
  CreateTxOptions,
  ModeInfo,
  PublicKey,
  SimulateResponse,
  Tx,
  TxAPI,
  TxInfo,
  Wallet,
} from '@initia/initia.js';
import { Fee } from '@initia/initia.js/dist/core';
import { WaitTxBroadcastResult } from '@initia/initia.js/dist/client/lcd/api/TxAPI';

const getChainId = async (args: { config: InitiaConfig }) => {
  const { config } = args;
  return config.client.tendermint.chainId();
};

/**
 * Fetches and returns the sequence number and authentication key for a specified account address.
 *
 * @param args - Contains the configuration and the blockchain account address.
 * @returns A Promise that resolves to an AccountData object containing the authentication key and sequence number.
 */
const getAccount = async (args: {
  config: InitiaConfig;
  accountAddress: AccountAddressInput;
}): Promise<AccountData> => {
  const { config, accountAddress } = args;

  // Fetch account data from the blockchain using the provided account address.
  // AccAddress.fromHex converts a hexadecimal string to an AccAddress, which is the required address format.
  const accountData = (await config.client.auth.accountInfo(
    AccAddress.fromHex(accountAddress.toString()),
  )) as BaseAccount;

  return {
    authentication_key: accountAddress.toString(), // The blockchain account address as the authentication key.
    sequence_number: accountData.sequence.toString(), // The sequence number of the account, converted to a string.
  };
};

/**
 * Currently not available in the Initia SDK
 */
const getAccountTransactions = () => {};

/**
 * Fetches and returns an array of Move modules deployed by a specified account on the Aptos blockchain.
 *
 * @param args - Contains configuration and parameters needed to fetch the account's modules.
 * @returns An array of MoveModuleBytecode, each representing a deployed Move module.
 */
const getAccountModules = async (args: {
  config: InitiaConfig;
  accountAddress: AccountAddressInput;
  options?: PaginationArgs; // Optional pagination arguments to limit and offset results.
}): Promise<MoveModuleBytecode[]> => {
  const { config, accountAddress, options } = args;

  // Fetch Move modules from the blockchain using the provided account address and pagination options.
  // AccAddress.fromHex converts a hexadecimal string to an AccAddress, which is the required address format.
  const res = await config.client.move.modules(
    AccAddress.fromHex(accountAddress.toString()),
    {
      'pagination.limit': options?.limit?.toString(), // Set the limit for the number of results.
      'pagination.offset': options?.offset?.toString(), // Set the offset for results pagination.
    },
  );

  return res[0].map((module) => ({
    bytecode: module.raw_bytes,
    abi: JSON.parse(module.abi) as MoveModule, // Parse the ABI from a JSON string to a MoveModule object.
  }));
};

/**
 * Fetches a specific resource for a given account address based on the resource type identifier.
 * @param args - Contains the configuration, account address, and the resource type identifier.
 * @returns {Promise<T>} - A Promise that resolves to a resource of type T.
 */
const getAccountResource = async <T>(args: {
  config: InitiaConfig;
  accountAddress: AccountAddressInput;
  resourceType: MoveStructId; // Identifier for the specific Move resource type to be fetched.
}): Promise<T> => {
  const { config, accountAddress, resourceType } = args;

  // Convert the account address from hexadecimal string to an AccAddress type required by the API.
  const address = AccAddress.fromHex(accountAddress.toString());

  // Fetch the resource from the blockchain using the provided account address and resource type identifier.
  const res = await config.client.move.resource(address, resourceType);

  return res as unknown as T;
};

/**
 * Fetches all resources for a given account address.
 * @param args - Contains the configuration and the account address.
 * @returns {Promise<MoveResource[]>} - A Promise that resolves to an array of MoveResource objects.
 */
const getAccountResources = async (args: {
  config: InitiaConfig; 
  accountAddress: AccountAddressInput;
}): Promise<MoveResource[]> => {
  const { config, accountAddress } = args;

  // Convert the account address from hexadecimal string to an AccAddress type required by the API.
  const address = AccAddress.fromHex(accountAddress.toString());

  // Fetch all resources associated with the account address.
  const res = await config.client.move.resources(address);

  // Map the result to ensure each item is treated as a MoveResource, returning an array of these resources.
  return res[0].map((resource) => resource as MoveResource);
};

/**
 * Fetches an item from a table collection in the Aptos blockchain using a table handle and a key.
 * @param args - Contains the API client configuration, table handle, and the key in bytes.
 * @returns {Promise<T>} - A Promise that resolves to the item of type T.
 */
const getTableItem = async <T>(args: {
  config: InitiaConfig; 
  handle: string; // The handle that uniquely identifies the table within the blockchain.
  keyBytes: string; // The key associated with the item in the table, provided in byte format.
}): Promise<T> => {
  const { handle, keyBytes } = args;

  // Use the client to fetch the table entry based on the provided handle and key.
  // This method contacts the blockchain and retrieves the item associated with the key in the specified table.
  let res = await args.config.client.move.tableEntry(handle, keyBytes);

  return res as unknown as T;
};

// Define a function to fetch ledger information from a Cosmos blockchain.
const getLedgerInfo = async (args: {
  config: InitiaConfig;
}): Promise<LedgerInfo> => {
  const { config } = args;
  const nodeInfo = await config.client.tendermint.nodeInfo();
  const blockInfo = await config.client.tendermint.blockInfo();
  const chainId = await config.client.tendermint.chainId();

  // We cannot get everything that LedgerInfo requires, so we are returning a different object. Please make sure to adjust this.
  return {
    chain_id: chainId,
    block_info: blockInfo,
    node_info: nodeInfo,
  } as unknown as LedgerInfo;
};

// Define a function to retrieve detailed information about a block by its height in a Cosmos blockchain.
const getBlockByHeight = async (args: {
  config: InitiaConfig;
  blockHeight: AnyNumber;
}): Promise<Block> => {
  const { config, blockHeight } = args;

  // Fetch block information using the provided block height. This includes details of the block such as its hash and timestamp.
  const blockInfo = await config.client.tendermint.blockInfo(
    blockHeight as number,
  );

  // Prepare parameters for querying transaction information by block height.
  const params = new URLSearchParams();
  params.append('height', blockHeight.toString());

  // Fetch transaction information for the specified block height. This will include data on all transactions within the block.
  const txInfos = await config.client.tx.txInfosByHeight(blockHeight as number);

  // Construct and return an object containing detailed information about the block.
  // Note: Cosmos blockchain does not use a 'ledger version' like Aptos, which uniquely identifies the state by transaction count.
  // In Cosmos, block height is the primary identifier.
  return {
    block_height: blockInfo.block.header.height, // The height of the block in the blockchain.
    block_hash: blockInfo.block_id.hash, // The cryptographic hash of the block.
    block_timestamp: blockInfo.block.header.time, // The timestamp at which the block was finalized.
    first_version: '?', // Placeholder: Cosmos does not have a 'first_version' concept similar to ledger versions.
    last_version: '?', // Placeholder: Cosmos does not have a 'last_version' concept similar to ledger versions.
    transactions: txInfos as unknown as Array<TransactionResponse>, // List of transactions included in the block.
  };
};

const getBlockByHash = async (args: {
  config: InitiaConfig;
  txHash: string;
}): Promise<Block> => {
  const { config, txHash } = args;
  const tx = await config.client.tx.txInfo(txHash);
  const blockInfo = await config.client.tendermint.blockInfo(
    tx.height as number,
  );
  const txInfos = await config.client.tx.txInfosByHeight(tx.height as number);

  return {
    block_height: blockInfo.block.header.height, // The height of the block in the blockchain.
    block_hash: blockInfo.block_id.hash, // The cryptographic hash of the block.
    block_timestamp: blockInfo.block.header.time, // The timestamp at which the block was finalized.
    first_version: '?', // Placeholder: Cosmos does not have a 'first_version' concept similar to ledger versions.
    last_version: '?', // Placeholder: Cosmos does not have a 'last_version' concept similar to ledger versions.
    transactions: txInfos as unknown as Array<TransactionResponse>,
  };
};

/**
 * Generates a raw, unsigned and unsubmitted transaction.
 *
 * @param args.initiaConfig We use InitiaConfig here, in a similar way to the Aptos SDK
 * @param args.sender The transaction's sender account address as a bech32 string
 * @param args.payload The transaction payload - can create with CreateTxOptions from Initia.js
 * @param args.options This field is not needed here since the transaction options are already in the args.payload*
 *
 * @returns Tx
 */
const generateRawTransaction = async (args: {
  initiaConfig: InitiaConfig;
  sender: string;
  payload: CreateTxOptions;
  options?: InputGenerateTransactionOptions;
  feePayerAddress?: AccountAddressInput;
}): Promise<Tx> => {
  const { initiaConfig, sender, payload } = args;
  return initiaConfig.client.tx.create([{ address: sender }], payload);
};

/**
 * Generates any transaction by passing in the required arguments.
 * Since the Aptos SDK function also returns a RawTransaction,
 * the GenerateRawTransaction function above can be used in a similar fashion.
 * Cosmos accepts any multiple messages in one transaction, so we can pass in any number of messages here.
 */
const generateTransaction = () => {};

/**
 * The data structure for a simple transaction simulation.
 */
type InputSimulateTransactionData = {
  /**
   * The transaction to simulate, probably generated by `generateRawTransaction()`
   */
  transaction: Tx;
  /**
   * For a single signer transaction
   */
  signerPublicKey: PublicKey;
};

/**
 * Simulates a transaction before singing it.
 *
 * @param args.signerPublicKey The signer public key
 * @param args.transaction The raw transaction to simulate
 *
 * @return SimulateResponse.
 * Here we return the response from the simulation, with all the necessary information.
 */
const simulateTransaction = async (
  args: { initiaConfig: InitiaConfig } & InputSimulateTransactionData,
): Promise<SimulateResponse> => {
  const { initiaConfig, transaction, signerPublicKey } = args;

  let simTx: Tx = transaction;
  if (transaction.signatures.length <= 0) {
    const authInfo = new AuthInfo([], new Fee(0, new Coins()));
    simTx = new Tx(transaction.body, authInfo, []);
    const account = await initiaConfig.client.auth.accountInfo(
      signerPublicKey.address(),
    );
    const sequenceNumber = account.getSequenceNumber();
    simTx.appendEmptySignatures([
      {
        publicKey: signerPublicKey,
        sequenceNumber,
      },
    ]);
  }

  return await initiaConfig.client.apiRequester
    .post<SimulateResponse.Data>(`/cosmos/tx/v1beta1/simulate`, {
      tx_bytes: TxAPI.encode(simTx),
    })
    .then((d) => SimulateResponse.fromData(d));
};

/**
 * Sign a transaction that can later be submitted to chain
 *
 * @param args.signer The signer account to sign the transaction, here we used a Wallet type from Initia.js
 * @param args.transaction An instance of a RawTransaction
 *
 * @return The signed transaction
 */
const signTransaction = async (args: {
  signer: Wallet;
  transaction: Tx;
}): Promise<Tx> => {
  const { signer, transaction } = args;
  const { account_number, sequence } = await signer.accountNumberAndSequence();
  return signer.key.signTx(transaction, {
    accountNumber: account_number,
    sequence,
    chainId: await signer.lcd.tendermint.chainId(),
    signMode: ModeInfo.SignMode.SIGN_MODE_DIRECT,
  });
};

/**
 * Interface that holds the user data input when submitting a transaction
 */
interface InputSubmitTransactionData {
  transaction: Tx;
  timeout?: number;
}

/**
 * Submit transaction to the network, there are multiple submission modes supported by Initia.js,
 * but we are using the sync mode here for simplicity.
 *
 * @param args.transaction A signed transaction to be submitted
 *
 * @return PendingTransactionResponse
 */
const submitTransaction = (
  args: {
    initiaConfig: InitiaConfig;
  } & InputSubmitTransactionData,
): Promise<WaitTxBroadcastResult> => {
  return args.initiaConfig.client.tx.broadcast(args.transaction, args.timeout);
};

/**
 * Couldn't find a reference to this function in the Aptos SDK.
 */
const submitSignedBCSTransaction = () => {};

/**
 * Couldn't find a reference to this function in the Aptos SDK.
 */
const sendAndConfirm = () => {};

/**
 * We could use getTransactionByHash below if we want to check for a transaction status.
 * There is no direct equivalent for the Aptos SDK waitFor.
 */
const waitForTransactionWithResult = () => {};

/*
 * Transaction version concept does not exist in Initia; therefore, it is not implemented.
 */
const getTransactionByVersion = () => {};

/*
 * This function in the Aptos SDK is a method of the Transaction class, which contains the config.
 * We are passing the config as a parameter here.
 * Also, the return type is different since transaction on Cosmos largely differs from Aptos.
 */
const getTransactionByHash = async (args: {
  initiaConfig: InitiaConfig;
  transactionHash: HexInput;
}): Promise<TxInfo> => {
  const { transactionHash } = args;
  return args.initiaConfig.client.tx.txInfo(transactionHash.toString());
};

/**
 * This concept does not exist in Initia; therefore, it is not implemented.
 */
const getEventsByEventHandle = () => {};

/*
 * This is the data structure for the gas estimation response.
 */
export type GasEstimation = {
  deprioritized_gas_estimate?: number;
  gas_estimate: Coins;
  prioritized_gas_estimate?: number;
};

/*
 * Unlike auction-based systems where higher gas prices increase the chances of inclusion,
 * the Cosmos SDK uses a minimum gas price.
 * Transactions that meet or exceed this minimum are included in blocks, while those below it are not considered.
 */
const estimateGasPrice = (initiaConfig: InitiaConfig): GasEstimation => {
  return {
    gas_estimate: new Coins(initiaConfig.client.config.gasPrices),
  };
};

/*
 * This is the data structure for the input payload for the view function.
 * For simplicity, we are using this instead of aptos sdk InputViewFunctionData.
 */
class InputViewFunctionData {
  function: string;
  typeArguments?: string[];
  functionArguments: string[];
}

const view = <T extends Array<MoveValue> = Array<MoveValue>>(args: {
  initiaConfig: InitiaConfig;
  payload: InputViewFunctionData;
  options?: LedgerVersionArg;
}): Promise<T> => {
  const { initiaConfig, payload } = args;
  const [moduleAddress, moduleName, functionName] =
    payload.function.split('::');

  return initiaConfig.client.move
    .viewJSON(
      moduleAddress,
      moduleName,
      functionName,
      payload.typeArguments,
      payload.functionArguments,
    )
    .then((res) => JSON.parse(res.data));
};

export {
  getChainId,
  getAccount,
  getAccountTransactions,
  getAccountModules,
  getAccountResource,
  getAccountResources,
  getTableItem,
  getLedgerInfo,
  getBlockByHeight,
  getBlockByHash,
  generateRawTransaction,
  generateTransaction,
  simulateTransaction,
  signTransaction,
  submitTransaction,
  submitSignedBCSTransaction,
  sendAndConfirm,
  waitForTransactionWithResult,
  getTransactionByVersion,
  getTransactionByHash,
  getEventsByEventHandle,
  estimateGasPrice,
  view,
};
