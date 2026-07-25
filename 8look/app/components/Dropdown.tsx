'use client';

import { type ReactNode, useState } from "react";


type DropdownProps = {
    children: ReactNode;
    trigger: ReactNode;
};

type DropdownItemProps = {
    children: ReactNode;
};

export default function Dropdown({ children, trigger }: DropdownProps): ReactNode
{
    const [show, setShow] = useState<boolean>(false);

    return(
        <div className="relative" onClick={() => setShow((isOpen) => !isOpen)}>
            <div>{trigger}</div>
            {show && (
                <ul className="absolute right-0 top-full z-20 mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] divide-y divide-[var(--border)]">
                    {children}
                </ul>
            )}
        </div>
    )
}

export function DropdownItem({ children }: DropdownItemProps): ReactNode
{
    return (
        <li className={`
            flex gap-3 items-center px-4
            bg-transparent text-[var(--foreground)]
            hover:bg-[var(--surface-soft)]
            `}>{children}</li>
    )
}
