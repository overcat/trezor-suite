import React, { useState } from 'react';

import { Meta, StoryObj } from '@storybook/react';

import { spacings } from '@trezor/theme';

import { SubTabs as SubTabsComponent, SubTabsProps, allowedSubTabsFrameProps } from './SubTabs';
import { subtabsSizes } from './types';
import { Column } from '../Flex/Flex';
import { IconName } from '../Icon/Icon';
import { getFramePropsStory } from '../../utils/frameProps';
import { variables } from '../../config';

const meta: Meta = {
    title: 'SubTabs',
} as Meta;
export default meta;

const SubTabsApp = (props: Partial<SubTabsProps>) => {
    const [selectedTab, setSelectedTab] = useState(0);

    const items = ['Lorem', 'Ipsum', 'Dolor Sit', 'Amet'].map((title, index) => ({
        title,
        id: title.toLowerCase(),
        onClick: () => {
            setSelectedTab(index);
        },
        iconName: variables.ICONS[index * 2] as IconName,
        'data-testid': title.toLowerCase(),
    }));

    const getContent = () => {
        switch (selectedTab) {
            case 0:
                return (
                    <div>
                        Pariatur magnam esse assumenda et reiciendis et ipsa aspernatur. Aut
                        deserunt voluptatum id. Consequatur voluptatem nostrum enim facere
                        accusantium qui provident. Eum at aut consequuntur. Blanditiis nihil impedit
                        esse fugit iste. Laboriosam voluptas asperiores aut a. Et esse expedita
                        accusamus. Ratione accusantium ipsam consequatur non in.
                    </div>
                );
            case 1:
                return (
                    <div>
                        Odit velit aliquam explicabo enim autem maiores harum est. Repellat error
                        rem omnis recusandae cumque veniam qui maiores. Et suscipit consequatur
                        dolor nesciunt nihil blanditiis reprehenderit facere. Cumque vitae excepturi
                        dignissimos numquam impedit dolores alias occaecati. Qui similique natus
                        suscipit minima. Sit voluptatum cum consequatur necessitatibus mollitia vel.
                        Voluptas cupiditate error aut numquam. Rerum quasi labore est perferendis
                        est assumenda.
                    </div>
                );
            case 2:
                return (
                    <div>
                        At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
                        praesentium voluptatum deleniti atque corrupti quos dolores et quas
                        molestias excepturi sint occaecati cupiditate non provident, similique sunt
                        in culpa qui officia deserunt mollitia animi, id est laborum et dolorum
                        fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero
                        tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus
                        id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis
                        dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut
                        rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et
                        molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente
                        delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut
                        perferendis doloribus asperiores repellat.
                    </div>
                );
            case 3:
                return (
                    <div>
                        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
                        doloremque laudantium, totam rem aperiam, eaque ipsa quae.
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Column gap={spacings.md}>
            <SubTabsComponent activeItemId={items[selectedTab].id} {...props}>
                {items.map(item => (
                    <SubTabsComponent.Item key={item.id} {...item}>
                        {item.title}
                    </SubTabsComponent.Item>
                ))}
            </SubTabsComponent>
            {getContent()}
        </Column>
    );
};

export const SubTabs: StoryObj = {
    render: props => <SubTabsApp {...props} />,
    args: {
        ...getFramePropsStory(allowedSubTabsFrameProps).args,
        size: 'medium',
    },
    argTypes: {
        ...getFramePropsStory(allowedSubTabsFrameProps).argTypes,
        size: {
            control: {
                type: 'select',
            },
            options: subtabsSizes,
        },
    },
};
