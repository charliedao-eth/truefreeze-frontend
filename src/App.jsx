import { useEffect, Fragment } from "react";
import { useMoralis } from "react-moralis";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import contractsByChain, {
  supportedTestnetChainIds,
  supportedProductionChainIds,
} from "contracts/contractInfo";
import Account from "components/Account/Account";
import Chains from "components/Chains";
import Claim from "components/Claim/Claim";
import Landing from "components/Landing";
import Lock from "components/App/Lock";
import MyFreezers from "components/App/MyFreezers";
import StakeAndBurn from "components/App/StakeAndBurn";

import { Layout, Menu } from "antd";
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
    flex: "1",
    justifyContent: "right",
  },
  selectedNav: {
    textDecoration: 'underline',
  }
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
  const supportedChainIds = IS_PRODUCTION_MODE
    ? supportedProductionChainIds
    : supportedTestnetChainIds;

  if (!contract) {
    // TODO display an error page + chain switcher
    return <div>Chain {chainId} is unsupported.</div>;
  }

  // TODO check dev-mode (isProductionMode in ../index.js) and display a warning banner at the top of the screen

  const WrapWithLayout = (props) => {
    return (
      <Fragment>
        {props.useAppHeader ? <AppHeader selectedNav={props.selectedNav} /> : <GenericHeader />}
        <div style={styles.content}>
          {props.children}
        </div>
        <Footer style={{ textAlign: "center" }}>
          <Text style={{ display: "block" }}>footer info todo</Text>
        </Footer>
      </Fragment>
    );
  }


  const AppHeader = (props) => {
    return (
      <Header style={styles.header}>
        <Logo />
        <Menu mode="horizontal" selectedKeys={props.selectedNav} style={{width:"480px", maxWidth:"100%", justifyContent: "center"}}>
          <Menu.Item key='lock'><a href="/lock">Lock</a></Menu.Item>
          <Menu.Item key='myfreezers'><a href="/myfreezers">My Freezers</a></Menu.Item>
          <Menu.Item key='stakeandburn'><a href="/stakeandburn">Stake and Burn</a></Menu.Item>
        </Menu>
        <div style={styles.headerRight}>
          <Chains supportedChainIds={supportedChainIds} />
          <NativeBalance />
          <Account />
          {props?.location?.pathname}
        </div>
      </Header>
    );
  };

  const GenericHeader = () => (
    <Header style={styles.header}>
      <Logo />
      <div style={styles.headerRight}>
        <a href="/app">Launch</a>
        <Account />
      </div>
    </Header>
  );


  return (
    <Layout style={{ height: "100vh", overflow: "auto" }}>
      <Router>
        <Switch>
          <Route exact path="/landing">
            <WrapWithLayout useAppHeader={false}><Landing /></WrapWithLayout>
          </Route>
          <Route exact path="/claim">
            <WrapWithLayout useAppHeader={false}><Claim contract={contract} /></WrapWithLayout>
          </Route>
          <Route exact path="/lock">
            <WrapWithLayout useAppHeader={true} selectedNav={'lock'}><Lock contract={contract} /></WrapWithLayout>
          </Route>
          <Route exact path="/myfreezers">
            <WrapWithLayout useAppHeader={true} selectedNav={'myfreezers'}><MyFreezers contract={contract} /></WrapWithLayout>
          </Route>
          <Route exact path="/stakeandburn">
            <WrapWithLayout useAppHeader={true} selectedNav={'stakeandburn'}><StakeAndBurn contract={contract} /></WrapWithLayout>
          </Route>
          <Route path="/app">
            <Redirect to="/lock" />
          </Route>
          <Route path="/">
            <Redirect to="/landing" />
          </Route>
        </Switch>
      </Router>
    </Layout>
  );
};


export const Logo = () => <div style={{ display: "flex", flex: "1" }}>logo todo</div>;

export default App;
