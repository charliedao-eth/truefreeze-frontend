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

import { Layout, Menu, ConfigProvider } from "antd";
import "antd/dist/antd.variable.min.css";
import NativeBalance from "components/NativeBalance";
import Text from "antd/lib/typography/Text";
const { Header, Footer } = Layout;
import logoSVG from "./assets/truefreezelogo.svg";

ConfigProvider.config({
  theme: {
    primaryColor: '#00E6B5',
    headingColor: '#FFFFFF',
    textColor: '#FFFFFF',
    textColorSecondary: '#426788',
    linkColor: '#FFFFFF',
  },
});

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
    height: "initial",
    background: "none",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "Roboto, sans-serif",
    borderBottom: "1px solid #FFFFFF",
    padding: "40px 100px 20px 100px",
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
  navbar: {
    background: "none",
    border: "none",
    color: "#FFFFFF",
    width: "480px", 
    maxWidth: "100%", 
    justifyContent: "center"
  },
  navbarItem: {
    borderColor: "#00E6B5",
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
        {props.useAppHeader ? (
          <AppHeader selectedNav={props.selectedNav} />
        ) : (
          <GenericHeader />
        )}
        <div style={styles.content}>{props.children}</div>
        <Footer style={{ textAlign: "center", background: "none" }}>
          <Text style={{ display: "block" }}>footer info todo</Text>
        </Footer>
      </Fragment>
    );
  };

  const AppHeader = (props) => {
    return (
      <Header style={styles.header}>
        <Logo />
        <Menu
          mode="horizontal"
          selectedKeys={props.selectedNav}
          style={styles.navbar}
        >
          <Menu.Item key="lock">
            <a href="/lock">Lock</a>
          </Menu.Item>
          <Menu.Item key="myfreezers">
            <a href="/myfreezers">My Freezers</a>
          </Menu.Item>
          <Menu.Item key="stakeandburn">
            <a href="/stakeandburn">Stake and Burn</a>
          </Menu.Item>
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
    <ConfigProvider>
    <Layout style={{ height: "100vh", overflow: "auto" }} className="gradient-bg">
      <Router>
        <Switch>
          <Route exact path="/landing">
            <WrapWithLayout useAppHeader={false}>
              <Landing />
            </WrapWithLayout>
          </Route>
          <Route exact path="/claim">
            <WrapWithLayout useAppHeader={false}>
              <Claim contract={contract} />
            </WrapWithLayout>
          </Route>
          <Route exact path="/lock">
            <WrapWithLayout useAppHeader={true} selectedNav={"lock"}>
              <Lock contract={contract} />
            </WrapWithLayout>
          </Route>
          <Route exact path="/myfreezers">
            <WrapWithLayout useAppHeader={true} selectedNav={"myfreezers"}>
              <MyFreezers contract={contract} />
            </WrapWithLayout>
          </Route>
          <Route exact path="/stakeandburn">
            <WrapWithLayout useAppHeader={true} selectedNav={"stakeandburn"}>
              <StakeAndBurn contract={contract} />
            </WrapWithLayout>
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
    </ConfigProvider>
  );
};

export const Logo = () => (
  <div style={{ display: "flex", flex: "1" }}>
    <img src={logoSVG} />
  </div>
);

export default App;
