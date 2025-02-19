import { ReactNode, useRef, useState } from 'react';

import { ElevationContext, ElevationUp, NewModal } from '@trezor/components';

import { LayoutContext, LayoutContextPayload } from 'src/support/suite/LayoutContext';
import { ModalContextProvider } from 'src/support/suite/ModalContext';
import { useResetScrollOnUrl } from 'src/hooks/suite/useResetScrollOnUrl';
import { GuideButton, GuideRouter } from 'src/components/guide';
import { useLayoutSize } from 'src/hooks/suite';
import { useClearAnchorHighlightOnClick } from 'src/hooks/suite/useClearAnchorHighlightOnClick';

import { Metadata } from '../Metadata';
import { ModalSwitcher } from '../modals/ModalSwitcher/ModalSwitcher';
import {
    AppWrapper,
    Body,
    Columns,
    ContentWrapper,
    PageWrapper,
    Wrapper,
} from './SuiteLayout/SuiteLayout';
import { TrafficLightOffset } from '../TrafficLightOffset';

interface LoggedOutLayout {
    children: ReactNode;
}

export const LoggedOutLayout = ({ children }: LoggedOutLayout) => {
    const [{ title, layoutHeader }, setLayoutPayload] = useState<LayoutContextPayload>({});

    const { scrollRef } = useResetScrollOnUrl();
    const { isMobileLayout } = useLayoutSize();
    const wrapperRef = useRef<HTMLDivElement>(null);

    useClearAnchorHighlightOnClick(wrapperRef);

    return (
        <ElevationContext baseElevation={-1}>
            <TrafficLightOffset>
                <Wrapper ref={wrapperRef} data-testid="@logged-out-layout">
                    <PageWrapper>
                        <NewModal.Provider>
                            <ModalContextProvider>
                                <Metadata title={title} />
                                <ModalSwitcher />

                                <LayoutContext.Provider value={setLayoutPayload}>
                                    <Body data-testid="@suite-layout/body">
                                        <Columns>
                                            <AppWrapper
                                                data-testid="@app"
                                                ref={scrollRef}
                                                id="layout-scroll"
                                            >
                                                {layoutHeader}
                                                <ElevationUp>
                                                    <ContentWrapper>{children}</ContentWrapper>
                                                </ElevationUp>
                                            </AppWrapper>
                                        </Columns>
                                    </Body>
                                </LayoutContext.Provider>

                                {!isMobileLayout && <GuideButton />}
                            </ModalContextProvider>
                        </NewModal.Provider>
                    </PageWrapper>
                    <GuideRouter />
                </Wrapper>
            </TrafficLightOffset>
        </ElevationContext>
    );
};
