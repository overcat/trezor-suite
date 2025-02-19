import React, { ReactNode } from 'react';

import {
    H2,
    Button,
    Card,
    ButtonProps,
    Column,
    Row,
    Paragraph,
    Divider,
    IconName,
    IconCircle,
    IconCircleVariant,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

interface AccountExceptionLayoutProps {
    title: ReactNode;
    description?: ReactNode;
    iconName?: IconName;
    iconVariant?: IconCircleVariant;
    actions?: ({ key: string } & ButtonProps)[];
}

export const AccountExceptionLayout = (props: AccountExceptionLayoutProps) => (
    <Card>
        <Column alignItems="center">
            {props.iconName && props.iconVariant && (
                <IconCircle
                    name={props.iconName}
                    variant={props.iconVariant}
                    size={90}
                    margin={{ top: spacings.xxl, bottom: spacings.xl }}
                />
            )}
            <H2>{props.title}</H2>
            <Paragraph variant="tertiary" typographyStyle="hint" margin={{ top: spacings.xs }}>
                {props.description}
            </Paragraph>
            {props.actions && (
                <>
                    <Divider margin={{ top: spacings.xxl, bottom: spacings.xxl }} />
                    <Row justifyContent="center" gap={spacings.md} margin={{ bottom: spacings.md }}>
                        {props.actions?.map(action => (
                            <Button minWidth={160} {...action} key={action.key} />
                        ))}
                    </Row>
                </>
            )}
        </Column>
    </Card>
);
