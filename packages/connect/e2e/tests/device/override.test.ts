import TrezorConnect from '../../../src';
import { getController, setup, initTrezorConnect } from '../../common.setup';

const controller = getController();

describe('TrezorConnect override param', () => {
    beforeAll(async () => {
        await setup(controller, {
            mnemonic: 'mnemonic_all',
        });
        await initTrezorConnect(controller, { autoConfirm: false });
    });

    afterAll(() => {
        controller.dispose();
        TrezorConnect.dispose();
    });

    [1, 10, 100, 300, 500, 1000, 1500].forEach(delay => {
        it(`override previous call after ${delay}ms`, async () => {
            TrezorConnect.removeAllListeners();

            const overriden = TrezorConnect.getAddress({
                path: "m/44'/1'/0'/0/0",
                showOnTrezor: true,
            });

            await new Promise(resolve => setTimeout(resolve, delay));

            const address = await TrezorConnect.getAddress({
                path: "m/44'/1'/0'/0/0",
                override: true,
                showOnTrezor: false,
            });
            expect(address.success).toBe(true);

            const response = await overriden;
            expect(response.success).toBe(false);
            expect(response.payload).toMatchObject({ code: 'Method_Override' });
        });
    });
});
