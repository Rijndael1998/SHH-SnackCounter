"use client";

import { useContext, useEffect, useState } from 'react';
import { IOContext } from './layout';
import { Button, Grid2, IconButton, Paper, Stack, Typography } from '@mui/material';
import Users, { UserCallback, UsersType, UserType } from '@/components/app/core/Users';
import { ifTrue } from '@/components/reactUtils';
import { FormatUKMoney } from '@/components/util';

// Icons
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';


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

type UserSelection = {
    userName?: UserType["name"],
    users: UsersType,
}

type UserDetailsProps = {
    snackCallback: UserCallback;
    returnCallback: () => any;
} & MainPageProps & UserSelection;

function UserDetails({ open, userName, users, snackCallback, returnCallback }: UserDetailsProps) {
    const io = useContext(IOContext);

    if (!open || userName === undefined || !io)
        return <></>

    // fresh user if details change
    const user = users.filter(v => v.name == userName)[0];

    const deleteAccount = () => {
        io.emit("user_delete", userName);
        returnCallback();
    }

    return <>
        <Typography variant='h1'>{userName}</Typography>
        <Typography variant='body1'>Balance {FormatUKMoney(user.value)}</Typography>

        <Stack direction="row" gap={1}>
            <Button variant='contained' onClick={() => snackCallback(user)}>
                Add Snack
            </Button>
            <Button variant='contained' color="secondary">
                Add Money
            </Button>
            <Button
                variant='contained'
                color="error"
                sx={{ marginLeft: "auto" }}
                onClick={() => deleteAccount()}>
                Delete Account
            </Button>
        </Stack>
    </>
}

type AddSnackToUserProps = {
    snacks: SnackState[],
    addedSnackCallback: () => any,
    userName: UserSelection["userName"],
} & MainPageProps;

function AddSnackToUser({ snacks, userName, open, addedSnackCallback }: AddSnackToUserProps) {
    // map between snack count and 
    const [snackCount, setSnackCount] = useState<Map<string, number>>(new Map());

    const totalSnackCost = [...snackCount].map(v => { // we're just calculating the sum of the snacks here
        const [name, quantity] = v;
        const snack = snacks.filter(v => v.name == name)[0];
        return snack.value * quantity;
    }).reduce<number>((p, c) => p + c, 0);

    const io = useContext(IOContext);

    const getSnack = (e: React.MouseEvent<HTMLElement>) => {
        const snack = e.currentTarget.dataset.snack;
        if (!snack)
            throw new Error("no snack datatype");

        return snack;
    }

    const snackDelta = (snack: string, delta: number) => {
        const newSnackCount = new Map(snackCount);
        const newCount = (newSnackCount.get(snack) ?? 0) + delta;
        if (newCount != 0)
            newSnackCount.set(snack, newCount);
        else
            newSnackCount.delete(snack);

        return newSnackCount;
    }

    const up = (e: React.MouseEvent<HTMLElement>) => {
        const snack = getSnack(e);
        const newSnackCount = snackDelta(snack, 1);
        setSnackCount(newSnackCount);
    }

    const down = (e: React.MouseEvent<HTMLElement>) => {
        const snack = getSnack(e);
        const newSnackCount = snackDelta(snack, -1);
        setSnackCount(newSnackCount);
    }

    const reset = (e: React.MouseEvent<HTMLElement>) => {
        const snack = getSnack(e);

        const newSnackCount = new Map(snackCount);
        newSnackCount.delete(snack);
        setSnackCount(newSnackCount);
    }

    const spendSnacks = () => {
        if (!io)
            return;

        setSnackCount(new Map());

        const payload = JSON.stringify({
            userName,
            snackCount: [...snackCount],
        });
        console.log(payload);
        io.emit("snack_spent", payload);

        addedSnackCallback();
    }

    if (!open || !io)
        return <></>;

    return <>
        <Typography variant='h1' mb={2}>Add snack for {userName}</Typography>
        <Grid2 container gap={1}>
            {snacks.map(snack => {
                const currentCount = snackCount.get(snack.name) ?? 0;

                return <Grid2
                    key={snack.name}
                    sx={{
                        width: "20ch",
                        maxWidth: "calc(100% - 2ch)",
                        textAlign: "centre",
                        margin: "auto",
                    }}>
                    <Paper elevation={5} sx={{
                        padding: "0.5em",
                        marginY: "0.5em",
                    }}>
                        <Typography variant='h2'>{snack.name}</Typography>
                        <Typography variant="subtitle1">{FormatUKMoney(snack.value)}</Typography>
                        <Stack direction={"row"} sx={[{
                            "*": {
                                transition: "ease 0.2s all",
                            }
                        }]}>
                            <IconButton data-snack={snack.name} onClick={up}>
                                <AddIcon />
                            </IconButton>
                            <IconButton data-snack={snack.name} onClick={down}>
                                <RemoveIcon />
                            </IconButton>
                            <span style={{ margin: "auto auto" }}>
                                {currentCount}
                            </span>
                            <IconButton
                                data-snack={snack.name}
                                disabled={currentCount == 0}
                                onClick={reset}>
                                <DeleteIcon />
                            </IconButton>
                        </Stack>
                    </Paper>
                </Grid2>
            })}
        </Grid2>
        <Typography variant='h1'>Summary</Typography>
        {
            [...snackCount].map(v => {
                const [name, quantity] = v;
                const snack = snacks.filter(v => v.name == name)[0];
                const total = snack.value * quantity;

                if (total != 0)
                    return <Stack
                        key={name}
                        direction={"row"}
                        style={{ borderBottom: "0.1ex dotted #aaa", fontFamily: "var(--mono)" }}
                    >
                        <p style={{ margin: "0 2ch 0 0" }}>{`${quantity} ${name} @ ${FormatUKMoney(snack.value)}`}</p>
                        <p style={{ margin: "0 2ch 0 auto" }}>{FormatUKMoney(total)}</p>
                    </Stack>
            })
        }

        <Typography variant='h2' mt={2}>
            {totalSnackCost > 0 ? "Total" : "Refunded Total"}
        </Typography>
        <p style={{ margin: "0", fontFamily: "var(--mono)" }}>
            {FormatUKMoney(Math.abs(totalSnackCost))}
        </p>

        <Stack direction={"row"}>
            <Button
                variant='contained'
                style={{ margin: "2em 0 0 auto" }}
                onClick={spendSnacks}>
                Apply Snacks
            </Button>
        </Stack>
    </>
};


function Loading({ open }: MainPageProps) {
    if (!open)
        return <></>

    return <>
        <Typography>Loading the ledger</Typography>
    </>
}

type SnackState = {
    name: string,
    value: number,
    url?: string,
};

export default function Home() {
    const io = useContext(IOContext);

    // live values
    const [usersState, setUsersState] = useState<UsersType>();
    const [snackState, setSanckState] = useState<SnackState[]>([]);

    // callbacks changing state
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
                        return setUsersState(msg["v"]);

                    case "snack":
                        return setSanckState(msg["v"]);
                }

            } catch {
                return;
            }
        }

        io.on("telem", telemetry);
        io.emit("ledger"); // asking for a ledger
        io.emit("snack"); // asking for snack list

        //todo, polling on a regular basis

        return () => {
            io.off("telem", telemetry);
        }

    }, [io]);

    // messy to do this in the other useEffect, but i'll do it if perf is bad
    useEffect(() => {
        if (pageState !== PageStates.LOADING)
            return;

        if (usersState !== undefined)
            return;

        setPageState(PageStates.LEDGER);
    }, [usersState, pageState]);

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
            {ifTrue(usersState !== undefined, <>

                <Ledger
                    open={pageState == PageStates.LEDGER}
                    userClickHandler={userClickHandler}
                    ledgerState={usersState!}
                />
                <UserDetails
                    open={pageState == PageStates.USER}
                    userName={displayUser}
                    users={usersState!}
                    snackCallback={showSnackPage}
                    returnCallback={() => setPageState(PageStates.LEDGER)}
                />


            </>)}

            <AddSnackToUser
                open={pageState == PageStates.FOOD}
                userName={displayUser}
                snacks={snackState}
                addedSnackCallback={() => setPageState(PageStates.LEDGER)}
            />
        </Paper>
        {/* <Paper sx={{ padding: "0.5em", marginTop: "2ex" }}>
            Connected: {isConnected ? "Yes" : "No"}
        </Paper> */}
    </>;
}