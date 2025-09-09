import { FormatUKMoney } from "@/components/util";
import { Stack } from "@mui/material";

export type UserType = {
    /**
     * The name of the user
     */
    name: string,

    /**
     * Value in GBP. Negative if in credit, positive if in debit
     */
    value: number,
};

export type UsersType = UserType[];
export type UserCallback = (user: UserType) => void;

export type UserPropType = { user: UserType, callback: UserCallback };

export function User({ user, callback }: UserPropType) {
    const pos = user.value > 0;

    return <Stack
        direction={"row"}
        onClick={() => callback(user)}
        style={{
            cursor: "pointer"
        }}>
        <div style={{ "width": "20ch" }}>
            {user.name}
        </div>
        <div style={{ "width": "1ch" , fontFamily: "var(--mono)" }}>
            {pos ? "" : "-"}
        </div>
        <div style={{ "width": "11ch", fontFamily: "var(--mono)" }}>
            {FormatUKMoney(Math.abs(user.value))}
        </div>
    </Stack>
}

export type UsersPropType = { users: UsersType, callback: UserCallback };

export default function Users({ users, callback }: UsersPropType) {
    return <>
        <Stack direction={"row"} sx={{ width: "32ch", textDecoration: "" }}>
            <div style={{ "width": "20ch" }}>
                {"Name"}
            </div>
            <div style={{ "width": "11ch" ,fontFamily: "var(--mono)" }}>
                {"Balance"}
            </div>
        </Stack>

        <Stack sx={{ width: "32ch" }}>{
            users.map(v => <User key={v.name} user={v} callback={callback} />)
        }</Stack>
    </>
}