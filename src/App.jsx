import { useEffect } from "react";
import { useMoralis } from "react-moralis";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import contractsByChain, {supportedTestnetChainIds, supportedProductionChainIds} from "contracts/contractInfo";
import Account from "components/Account/Account";
import Chains from "components/Chains";
import TokenPrice from "components/TokenPrice";
import Dashboard from "components/Dashboard/Dashboard";
import { Layout } from "antd";
import "antd/dist/antd.css";
import NativeBalance from "components/NativeBalance";
import Text from "antd/lib/typography/Text";
const { Header, Footer } = Layout;
import svgs from "helpers/svgs";

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

const App = ({ IS_PRODUCTION_MODE }) => {
  const {
    isWeb3Enabled,
    enableWeb3,
    isAuthenticated,
    isWeb3EnableLoading,
    chainId,
  } = useMoralis();

  useEffect(() => {
    const connectorId = window.localStorage.getItem("connectorId");
    if (isAuthenticated && !isWeb3Enabled && !isWeb3EnableLoading)
      enableWeb3({ provider: connectorId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isWeb3Enabled]);

  const contract = contractsByChain[chainId];
  const supportedChainIds = IS_PRODUCTION_MODE ? supportedProductionChainIds : supportedTestnetChainIds;

  if (!contract) {
    // TODO display an error page + chain switcher
    return <div>Chain {chainId} is unsupported.</div>;
  }

  // TODO check dev-mode (isProductionMode in ../index.js) and display a warning banner at the top of the screen

  return (
    <Layout style={{ height: "100vh", overflow: "auto" }}>
      <Router>
        <Header style={styles.header}>
          <Logo />
          <div style={styles.headerRight}>
            <Chains supportedChainIds={supportedChainIds} />(
            {!chainId ? null : (
              <TokenPrice
                address={contract?.frToken?.address}
                chain={chainId}
                svgImage={svgs["frEth"]?.()}
              />
            )}
            )
            {/* Token price calls will fail as there's no exchange data yet. Clearly! */}
            <NativeBalance />
            <Account />
          </div>
        </Header>

        <div style={styles.content}>
          <Switch>
            <Route exact path="/dashboard">
              <Dashboard contract={contract} />
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
        <Text style={{ display: "block" }}>footer info todo</Text>
      </Footer>
    </Layout>
  );
};

export const Logo = () => <div style={{ display: "flex" }}>logo todo</div>;

export default App;
