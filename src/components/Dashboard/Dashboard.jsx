import { useMoralis } from "react-moralis";
import { Skeleton } from "antd";
import LockUnlock from "./LockUnlock";
import MyFreezers from "./MyFreezers";
import Staking from "./Staking";

/**
 * The dapp post-authetication home page
 * @param {*} props
 * @returns <Dashboard> JSX Elemenet
 */

function Dashboard(props) {
    const { account, isAuthenticated } = useMoralis();
    if (!props.address && (!account || !isAuthenticated))
        return <Skeleton />;

    return (
        <div>
            {/* TODO Split each view below into their own routes */}
            <LockUnlock />
            <hr />
            <MyFreezers />
            <hr />
            <Staking />
        </div>
    );
}

export default Dashboard;
