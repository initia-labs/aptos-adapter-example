import { InitiaConfig } from './client';
import { Coins, MnemonicKey, MsgPublish, Wallet } from '@initia/initia.js';
import { Fee } from '@initia/initia.js/dist/core';
import {
  getChainId,
  getAccount,
  getAccountModules,
  getAccountResource,
  getAccountResources,
  getTableItem,
  getLedgerInfo,
  getBlockByHeight,
  getBlockByHash,
  generateRawTransaction,
  simulateTransaction,
  signTransaction,
  submitTransaction,
  getTransactionByHash,
  estimateGasPrice,
  view,
} from './initia';

(async () => {
  const initiaConfig = new InitiaConfig('https://lcd.initiation-1.initia.xyz');
  const key = new MnemonicKey({
    mnemonic:
      'infant ribbon limit blood arrow because wing weasel judge stem thrive connect cattle quote habit host bunker forum prefer fresh filter chapter echo fortune',
  });
  const wallet = new Wallet(initiaConfig.client, key);
  const sender = wallet.key.accAddress.toString();

  console.log('getChainId =>', await getChainId({ config: initiaConfig }));

  console.log(
    'getAccount =>',
    await getAccount({
      config: initiaConfig,
      accountAddress: '0xee0019b10a5d5db025ac3dc15f3621cad3684a14',
    }),
  );

  console.log(
    'getAccountModules =>',
    await getAccountModules({
      config: initiaConfig,
      accountAddress: '0x1',
    }).then((res) => res[0]),
  );

  type MetaDataStore = {
    metadata: {
      handle: string;
      length: string;
    };
  };
  console.log(
    'getAccountResource =>',
    await getAccountResource<MetaDataStore>({
      config: initiaConfig,
      accountAddress: '0x1',
      resourceType: '0x1::code::MetadataStore',
    }),
  );

  console.log(
    'getAccountResources =>',
    await getAccountResources({ config: initiaConfig, accountAddress: '0x1' }),
  );

  console.log(
    'getTableItem =>',
    await getTableItem({
      config: initiaConfig,
      handle:
        '0x98a5b7ca31c1c0ff35b2954d86e8b280785ba1a2cd6dd878d14d1a0ad222184f',
      keyBytes: 'CDB4MTo6YWNs',
    }),
  );

  console.log(
    'getLedgerInfo =>',
    JSON.stringify(
      await getLedgerInfo({ config: initiaConfig }).then((res) => [
        (res as unknown as object)['node_info'].default_node_info,
      ]),
      null,
      2,
    ),
  );

  console.log(
    'getBlockByHeight =>',
    JSON.stringify(
      await getBlockByHeight({ config: initiaConfig, blockHeight: 4494783 }),
      null,
      2,
    ),
  );

  console.log(
    'getBlockByHash =>',
    JSON.stringify(
      await getBlockByHash({
        config: initiaConfig,
        txHash:
          'A97721A79A52C7B3D521D0DD611662048EF6303C684EE209F58D4D18F7D32EF5',
      }).then((res) => [res.block_hash, res.block_height]),
      null,
      2,
    ),
  );

  const rawTx = await generateRawTransaction({
    initiaConfig,
    sender,
    payload: {
      msgs: [
        MsgPublish.fromData({
          sender,
          code_bytes: [
            'oRzrCwYAAAADAQACBwIHCAkgAAAGc2VudHJ5AAAAAAAAAAAAAAAAih1fpU7fQj4kEwu37+guBdP6l5EA',
          ],
          upgrade_policy: MsgPublish.Policy.COMPATIBLE,
          '@type': '/initia.move.v1.MsgPublish',
        }),
      ],
      fee: new Fee(
        150000,
        new Coins({
          'move/944f8dd8dc49f96c25fea9849f16436dcfa6d564eec802f3ef7f8b3ea85368ff': 30000,
        }),
      ),
      memo: 'sent from the app',
      gas: '150000',
      gasPrices: initiaConfig.client.config.gasPrices,
      gasAdjustment: 1.4,
      feeDenoms: [
        'move/944f8dd8dc49f96c25fea9849f16436dcfa6d564eec802f3ef7f8b3ea85368ff',
      ],
    },
  });

  console.log('generateRawTransaction =>', rawTx.toData());

  console.log(
    'simulateTransaction =>',
    await simulateTransaction({
      initiaConfig,
      transaction: rawTx,
      signerPublicKey: wallet.key.publicKey,
    }).then((res) => [
      res.result.log.toString(),
      res.result.data.toString(),
      res.result.events.map((event) => [event.type, event.attributes[0].value]),
      res.gas_info,
    ]),
  );

  const signedTx = await signTransaction({
    signer: wallet,
    transaction: rawTx,
  });

  console.log('signTransaction =>', signedTx.signatures);

  console.log(
    'submitTransaction =>',
    await submitTransaction({
      initiaConfig,
      transaction: signedTx,
    }).then((res) => [
      res.txhash,
      res.raw_log,
      res.height,
      res.timestamp,
      res.gas_used,
      res.gas_wanted,
    ]),
  );

  console.log(
    'getTransactionByHash =>',
    await getTransactionByHash({
      initiaConfig,
      transactionHash:
        'A57DC7A271FE5FB60F4478000DE29C1FB6B9C2A047D72C65802AE23E62AD173E',
    }).then((res) => res.txhash),
  );

  console.log('estimateGasPrice =>', estimateGasPrice(initiaConfig));

  console.log(
    'view =>',
    await view({
      initiaConfig,
      payload: {
        function:
          '0xb9fe1fd018852d49cd066379ba314f94dce57f16::oracle::get_reference_base',
        functionArguments: ['"BTC"'],
      },
    }),
  );
})();
