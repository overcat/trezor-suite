import { formInputsMaxLength } from '@suite-common/validators';
import { getInputState } from '@suite-common/wallet-utils';
import { Icon, Input } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useTranslation } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';

interface StellarMemoProps {
    close: () => void;
}

export const StellarMemo = ({ close }: StellarMemoProps) => {
    const {
        register,
        getDefaultValue,
        formState: { errors },
        composeTransaction,
    } = useSendFormContext();

    const { translationString } = useTranslation();

    const inputName = 'stellarMemo';
    const inputValue = getDefaultValue(inputName) || '';
    const error = errors[inputName];
    const { ref: inputRef, ...inputField } = register(inputName, {
        onChange: () => composeTransaction(inputName),
        required: translationString('MEMO_NOT_SET'),
    });

    return (
        <Input
            inputState={getInputState(error)}
            data-testid={inputName}
            defaultValue={inputValue}
            maxLength={formInputsMaxLength.stellarTextMemo}
            label={<Translation id="MEMO_TEXT" />}
            labelRight={<Icon size={20} name="close" onClick={close} />}
            bottomText={error?.message || null}
            innerRef={inputRef}
            {...inputField}
        />
    );
};
