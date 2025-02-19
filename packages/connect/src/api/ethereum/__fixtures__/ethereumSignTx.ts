import { EthereumTransaction, EthereumTransactionEIP1559 } from '../../../exports';

interface EthereumTxFixture {
    description: string;
    type?: number;
    tx: EthereumTransactionEIP1559 | EthereumTransaction;
    signature: {
        v: `0x${string}`;
        r: `0x${string}`;
        s: `0x${string}`;
    };
    from: string;
    result: string;
}

export const serializeEthereumTx: EthereumTxFixture[] = [
    {
        // https://eth1.trezor.io/tx/0xf6652a681b4474132b8b96512eb0bd5311f5ed8414af59e715c9738a3b3673f3
        description: 'Legacy tx - ETH regular',
        from: '0x73d0385f4d8e00c5e6504c6030f47bf6212736a8',
        tx: {
            // data sent to TrezorConnect.ethereumSignTransaction
            chainId: 1,
            to: '0x4dC573D5DB497C0bF0674599E81c7dB91151D4e6',
            value: '0x3905f13a8f0e',
            nonce: '0x12',
            gasLimit: '0x5208',
            gasPrice: '0x104c533c00',
            data: '0x',
        },
        // data received from TrezorConnect.ethereumSignTransaction
        signature: {
            v: '0x1c',
            r: '0x4256ec5ddf73f12f781e9f646f56fd8843296cf3eb7e2fb8f0b67ea317be3e7c',
            s: '0x7be26525b6d6d39ef8745801bbb463c35ede09746708316a011e6eee7a2d83cf',
        },
        result: '0xf6652a681b4474132b8b96512eb0bd5311f5ed8414af59e715c9738a3b3673f3',
    },
    {
        // https://eth1.trezor.io/tx/0xdcaf3eba690a3cdbad8c2926a8f5a95cd20003c5ba2aace91d8c5fe8048e395b
        description: 'Legacy tx - ETH with ERC20',
        from: '0x73d0385f4d8e00c5e6504c6030f47bf6212736a8',
        tx: {
            chainId: 1,
            to: '0xa74476443119A942dE498590Fe1f2454d7D4aC0d',
            value: '0x0',
            nonce: '0xb',
            gasLimit: '0x30d40',
            gasPrice: '0x12a05f200',
            data: '0xa9059cbb000000000000000000000000a6abb480640d6d27d2fb314196d94463cedcb31e0000000000000000000000000000000000000000000000000011c37937e08000',
        },
        signature: {
            v: '0x26',
            r: '0x47ef1bb1625e4152b0febf6ddc1a57bfcea6438132928dda4c9c092b34f38a78',
            s: '0x3f70084c300235d588b70103988dd6f367e0f67bf38e2759a4c77aa461b220e2',
        },
        result: '0xdcaf3eba690a3cdbad8c2926a8f5a95cd20003c5ba2aace91d8c5fe8048e395b',
    },
    {
        // https://etc1.trezor.io/tx/0xebd7ef20c4358a6fdb09a951d6e77b8e88b37ac0f7a8d4e3b68f1666bf4c1d1a
        description: 'Legacy tx - ETC regular',
        from: '0xf410e37e9c8bcf8cf319c84ae9dcebe057804a04',
        tx: {
            chainId: 61,
            to: '0xABE894C18832edbe9B7926D729FA950673faD1EC',
            value: '0x56c212a8e4628',
            nonce: '0x0',
            gasLimit: '0x5208',
            gasPrice: '0x5409c6a7b',
            data: '0x',
        },
        signature: {
            v: '0x9e',
            r: '0x9d4599beedc587e0dc3d88578d79573c0138f9389810ffb036c37423ccd86375',
            s: '0x4a0eb870fbae9a11a02e3e0068830d141ee952bb4ab4d1e1b7542d75f7a24dc1',
        },
        result: '0xebd7ef20c4358a6fdb09a951d6e77b8e88b37ac0f7a8d4e3b68f1666bf4c1d1a',
    },
    {
        description: 'EIP-1559 tx - ETH contract call',
        type: 2,
        from: '0x73d0385f4d8e00c5e6504c6030f47bf6212736a8',
        tx: {
            chainId: 137,
            to: '0x958c6ABB69FeF37CB1E8f1bABB745da3bec78F86',
            value: '0x2386f26fc10000',
            nonce: '0x13',
            gasLimit: '0x5e56',
            maxFeePerGas: '0xb2d2318f8',
            maxPriorityFeePerGas: '0xb2d215740',
            data: '0x',
        },
        signature: {
            v: '0x0',
            r: '0x3e6f0a17f515ccfdfdd5d6320dcc006959e942b715e78a52decb5d93ffb97af5',
            s: '0x2f45463634e03d918ac099db760b2ca47f9f1ba900d86bf670a21cb46c41ddbe',
        },
        result: '0xdbfebc05b18c0b5a1e28e8f93283409c6c58fa0cd09610d2f0c580751d535de0',
    },
];
