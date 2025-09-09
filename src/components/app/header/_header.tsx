"use client";

import { JSX, ReactNode, useContext } from "react";
import headerStyles from "./header.module.scss";
import slidingStyles from "./sliding.module.scss";
import { usePathname } from "next/navigation";
import classNames from "classnames";
import { IOContext } from "@/app/layout";

export default function Header({ children }: { children: ReactNode }): JSX.Element {
    const pathname = usePathname();
    const red = pathname?.includes("/debug") ?? false;
    const io = useContext(IOContext);

    // steps -115, -90, -60, 0
    const degRotation = io ? 0 : -115;

    return <>
        <div className={classNames(headerStyles.header, red && headerStyles.red)}>
            {children}
            <div style={{
                marginRight: "1em",
                display: "flex",
                flexDirection: "column",
                textAlign: "right",
            }}>
                <p>
                    {"This is a test ledger system."}
                </p>
                <p>
                    {"(ask Lukasz)"}
                </p>
                <p />
                <p>
                    {"Connected: "}{io !== undefined ? "Yes" : "No"}
                </p>
            </div>
        </div>
    </>
}