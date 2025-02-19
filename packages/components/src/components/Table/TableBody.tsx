import { ReactNode } from 'react';

export interface TableBodyProps {
    children: ReactNode;
}

export const TableBody = ({ children }: TableBodyProps) => <tbody>{children}</tbody>;
