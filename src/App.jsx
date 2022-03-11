import { useEffect } from "react";
import { useMoralis } from "react-moralis";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import rinkebyContracts from "contracts/contractInfo";
import Account from "components/Account/Account";
import Chains from "components/Chains";
import TokenPrice from "components/TokenPrice";
import Dashboard from "components/Dashboard/Dashboard";
import { Layout } from "antd";
import "antd/dist/antd.css";
import NativeBalance from "components/NativeBalance";
import Text from "antd/lib/typography/Text";
const { Header, Footer } = Layout;

const styles = {
  content: {
    display: "flex",
    justifyContent: "center",
    fontFamily: "Roboto, sans-serif",
    color: "#041836",
    marginTop: "130px",
    padding: "10px",
  },
  header: {
    position: "fixed",
    zIndex: 1,
    width: "100%",
    background: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "Roboto, sans-serif",
    borderBottom: "2px solid rgba(0, 0, 0, 0.06)",
    padding: "0 10px",
    boxShadow: "0 1px 10px rgb(151 164 175 / 10%)",
  },
  headerRight: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    fontSize: "15px",
    fontWeight: "600",
  },
};

const frEthSVG = (<svg style={{ "width": "40px" }} viewBox="0 0 166.96 166.96" xmlns="http://www.w3.org/2000/svg"> <defs /> <g id="Layer_2" data-name="Layer 2"> <g id="Layer_1-2" data-name="Layer 1"> <polygon className="cls-1" points="83.48 44.67 83.48 59.43 101.59 33.99 83.48 44.67" /> <polygon className="cls-1" points="83.48 22.32 83.48 41.26 101.59 30.55 83.48 22.32" /> <polygon className="cls-1" points="83.48 0.5 83.48 22.32 101.59 30.55 83.48 0.5" /> <polygon className="cls-1" points="83.48 44.67 83.48 59.43 65.37 33.99 83.48 44.67" /> <polygon className="cls-1" points="83.48 22.32 83.48 41.26 65.37 30.55 83.48 22.32" /> <polygon className="cls-1" points="83.48 0.5 83.48 22.32 65.37 30.55 83.48 0.5" /> <polygon className="cls-1" points="55.15 55.21 62.2 62.26 58.7 41.45 55.15 55.21" /> <polygon className="cls-1" points="44.47 44.53 53.52 53.58 57.06 39.8 44.47 44.53" /> <polygon className="cls-1" points="34.05 34.1 44.47 44.53 57.06 39.8 34.05 34.1" /> <polygon className="cls-1" points="55.15 55.21 62.2 62.26 41.39 58.76 55.15 55.21" /> <polygon className="cls-1" points="44.47 44.53 53.52 53.58 39.75 57.11 44.47 44.53" /> <polygon className="cls-1" points="34.05 34.1 44.47 44.53 39.75 57.11 34.05 34.1" /> <polygon className="cls-1" points="44.67 83.48 59.43 83.48 33.99 65.37 44.67 83.48" /> <polygon className="cls-1" points="22.32 83.48 41.26 83.48 30.55 65.37 22.32 83.48" /> <polygon className="cls-1" points="0.5 83.48 22.32 83.48 30.55 65.37 0.5 83.48" /> <polygon className="cls-1" points="44.67 83.48 59.43 83.48 33.99 101.59 44.67 83.48" /> <polygon className="cls-1" points="22.32 83.48 41.26 83.48 30.55 101.59 22.32 83.48" /> <polygon className="cls-1" points="0.5 83.48 22.32 83.48 30.55 101.59 0.5 83.48" /> <polygon className="cls-1" points="56.75 110.21 64.3 102.66 42.02 106.41 56.75 110.21" /> <polygon className="cls-1" points="45.31 121.64 55.01 111.95 40.25 108.17 45.31 121.64" /> <polygon className="cls-1" points="34.15 132.81 45.31 121.64 40.25 108.17 34.15 132.81" /> <polygon className="cls-1" points="56.75 110.21 64.3 102.66 60.55 124.94 56.75 110.21" /> <polygon className="cls-1" points="45.31 121.64 55.01 111.95 58.79 126.7 45.31 121.64" /> <polygon className="cls-1" points="34.15 132.81 45.31 121.64 58.79 126.7 34.15 132.81" /> <polygon className="cls-1" points="83.48 122.28 83.48 107.53 65.37 132.97 83.48 122.28" /> <polygon className="cls-1" points="83.48 144.64 83.48 125.7 65.37 136.41 83.48 144.64" /> <polygon className="cls-1" points="83.48 166.46 83.48 144.64 65.37 136.41 83.48 166.46" /> <polygon className="cls-1" points="83.48 122.28 83.48 107.53 101.59 132.97 83.48 122.28" /> <polygon className="cls-1" points="83.48 144.64 83.48 125.7 101.59 136.41 83.48 144.64" /> <polygon className="cls-1" points="83.48 166.46 83.48 144.64 101.59 136.41 83.48 166.46" /> <polygon className="cls-1" points="110.3 110.3 102.78 102.78 106.52 124.98 110.3 110.3" /> <polygon className="cls-1" points="121.69 121.69 112.04 112.04 108.27 126.73 121.69 121.69" /> <polygon className="cls-1" points="132.81 132.81 121.69 121.69 108.27 126.73 132.81 132.81" /> <polygon className="cls-1" points="110.3 110.3 102.78 102.78 124.98 106.52 110.3 110.3" /> <polygon className="cls-1" points="121.69 121.69 112.04 112.04 126.73 108.27 121.69 121.69" /> <polygon className="cls-1" points="132.81 132.81 121.69 121.69 126.73 108.27 132.81 132.81" /> <polygon className="cls-1" points="122.28 83.48 107.53 83.48 132.97 101.59 122.28 83.48" /> <polygon className="cls-1" points="144.64 83.48 125.7 83.48 136.41 101.59 144.64 83.48" /> <polygon className="cls-1" points="166.46 83.48 144.64 83.48 136.41 101.59 166.46 83.48" /> <polygon className="cls-1" points="122.28 83.48 107.53 83.48 132.97 65.37 122.28 83.48" /> <polygon className="cls-1" points="144.64 83.48 125.7 83.48 136.41 65.37 144.64 83.48" /> <polygon className="cls-1" points="166.46 83.48 144.64 83.48 136.41 65.37 166.46 83.48" /> <polygon className="cls-1" points="111.47 55.49 104.34 62.62 125.38 59.08 111.47 55.49" /> <polygon className="cls-1" points="122.27 44.69 113.12 53.84 127.05 57.41 122.27 44.69" /> <polygon className="cls-1" points="132.81 34.15 122.27 44.69 127.05 57.41 132.81 34.15" /> <polygon className="cls-1" points="111.47 55.49 104.34 62.62 107.88 41.58 111.47 55.49" /> <polygon className="cls-1" points="122.27 44.69 113.12 53.84 109.55 39.91 122.27 44.69" /> <polygon className="cls-1" points="132.81 34.15 122.27 44.69 109.55 39.91 132.81 34.15" /> </g> </g> </svg>);

const App = () => {
  const { isWeb3Enabled, enableWeb3, isAuthenticated, isWeb3EnableLoading } =
    useMoralis();

  useEffect(() => {
    const connectorId = window.localStorage.getItem("connectorId");
    if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading)
      enableWeb3({ provider: connectorId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isWeb3Enabled]);

  return (
    <Layout style={{ height: "100vh", overflow: "auto" }}>
      <Router>
        <Header style={styles.header}>
          <Logo />
          <div style={styles.headerRight}>
            <Chains />
            <TokenPrice
              address={rinkebyContracts.frToken.address}
              chain={"0x2a"}
              svgImage={frEthSVG}
            /> {/* Token price calls will fail as there's no exchange data yet. Clearly! */}
            <NativeBalance />
            <Account />
          </div>
        </Header>

        <div style={styles.content}>
          <Switch>
            <Route exact path="/dashboard">
              <Dashboard />
            </Route>
            <Route path="/">
              <Redirect to="/dashboard" />
            </Route>
            <Route path="/nonauthenticated">
              <>Please login using the "Authenticate" button</>
            </Route>
          </Switch>
        </div>
      </Router>
      <Footer style={{ textAlign: "center" }}>
        <Text style={{ display: "block" }}>
          footer info todo
        </Text>
      </Footer>
    </Layout>
  );
};

export const Logo = () => (
  <div style={{ display: "flex" }}>
    logo todo
  </div>
);

export default App;
