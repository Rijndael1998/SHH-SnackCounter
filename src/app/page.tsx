"use client";

import { useContext, useEffect, useRef, useState } from 'react';
import { IOContext } from './layout';
import { Button, Grid2, Paper, Stack, SxProps, Theme, Typography } from '@mui/material';
import Users, { UserCallback, UsersType, UserType } from '@/components/app/core/Users';

enum PageStates {
    LOADING, // not used yet
    LEDGER, // main page
    USER, // page showing user details
    FOOD, // page showing what food is available to get
    MONEY, // page showing money options to user
    ADD_USER, // page showing user details
};


type MainPageProps = {
    open: boolean,
}

type LedgerProps = {
    ledgerState: UsersType,
    userClickHandler: UserCallback
} & MainPageProps;

function Ledger({ ledgerState, open, userClickHandler }: LedgerProps) {
    if (!open)
        return <></>

    return <>
        <Typography variant='h1'>Ledger</Typography>
        <Users users={ledgerState} callback={userClickHandler} />
    </>
}

type UserDetailsProps = {
    userName?: UserType["name"],
    users: UsersType,
} & MainPageProps;

function UserDetails({ open, userName, users }: UserDetailsProps) {
    if (!open || userName === undefined)
        return <></>

    // fresh user if details change
    const user = users.filter(v => v.name == userName)[0];

    return <>
        <Typography variant='h1'>{userName}</Typography>
        <Typography variant='body1'>Balance {user.value}</Typography>

        <Stack direction="row" gap={1}>
            <Button variant='contained'>
                Add Snack
            </Button>
            <Button variant='contained' color="secondary">
                Add Money
            </Button>
            <Button variant='contained' color="error" sx={{ marginLeft: "auto" }}>
                Delete Account
            </Button>
        </Stack>
    </>
}


function Loading({ open }: MainPageProps) {
    if(!open)
        return <></>

    return <>
        <Typography>Loading the ledger</Typography>
    </>
}

export default function Home() {
    const io = useContext(IOContext);

    const [usersState, setUsersState] = useState<UsersType>([]);
    const [pageState, setPageState] = useState<PageStates>(PageStates.LOADING);
    const [displayUser, setDisplayUser] = useState<UserType["name"]>(); // we will user userIDs for the other component

    useEffect(() => {
        if (!io)
            return;

        const telemetry = (e: ArrayBuffer) => {
            try {
                const msg = JSON.parse(Buffer.from(e).toString());
                console.log(msg);

                switch (msg["k"]) {
                    case "ledger":
                        setUsersState(msg["v"]);
                        setPageState(PageStates.LEDGER);
                }

            } catch {
                return;
            }
        }

        io.on("telem", telemetry);
        io.emit("ledger"); // asking for a ledger

        return () => {
            io.off("telem", telemetry);
        }

    }, [io]);

    const userClickHandler: UserCallback = (user: UserType) => {
        console.log("User clicked", user);
        setPageState(PageStates.USER);
        setDisplayUser(user.name);
    };

    const showSnackPage: UserCallback = (user: UserType) => {
        console.log("snack clicked", user);
        setPageState(PageStates.FOOD);
        setDisplayUser(user.name);
    }

    const isConnected = io !== undefined;

    return <>
        <Stack direction={"row"} gap={1}>
            <Button
                variant='outlined'
                disabled={pageState == PageStates.LEDGER || pageState == PageStates.LOADING}
                onClick={() => setPageState(PageStates.LEDGER)}>
                Return to Ledger
            </Button>
            <Button
                variant='contained'
                disabled={pageState == PageStates.ADD_USER || pageState == PageStates.LOADING}
                onClick={() => setPageState(PageStates.ADD_USER)}>
                Add User
            </Button>
        </Stack>

        <Paper sx={{ padding: "0.5em", marginY: "0.5em" }}>
            <Loading open={pageState == PageStates.LOADING} />
            <Ledger
                open={pageState == PageStates.LEDGER}
                userClickHandler={userClickHandler}
                ledgerState={usersState}
            />
            <UserDetails
                open={pageState == PageStates.USER}
                userName={displayUser}
                users={usersState}
            />
        </Paper>
        {/* <Paper sx={{ padding: "0.5em", marginTop: "2ex" }}>
            Connected: {isConnected ? "Yes" : "No"}
        </Paper> */}
    </>;
}