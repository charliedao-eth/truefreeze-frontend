import { useState, useEffect, useMemo, Fragment } from "react";
import { useMoralis } from "react-moralis";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import contractsByChain, { supportedTestnetChainIds, supportedProductionChainIds } from "contracts/contractInfo";
import useToken from "hooks/useToken";
import Account from "components/Account/Account";
import Chains from "components/Chains";
import Claim from "components/Claim/Claim";
import Landing from "components/Landing";
import Lock from "components/App/Lock";
import MyFreezers from "components/App/MyFreezers";
import StakeAndBurn from "components/App/StakeAndBurn";

import { Layout, Menu, ConfigProvider, message, Skeleton, Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import "antd/dist/antd.variable.min.css";
const { Header, Footer } = Layout;
import logoSVG from "./assets/truefreezelogo.svg";
import gradientBgBlue from "./assets/gradientbgblue.png";
import gradientBgGreen from "./assets/gradientbggreen.png";
import gradientBgRed from "./assets/gradientbgred.png";

ConfigProvider.config({
  theme: {
    primaryColor: "#00E6B5",
    headingColor: "#FFFFFF",
    textColor: "#FFFFFF",
    textColorSecondary: "#426788",
    linkColor: "#FFFFFF",
  },
});

const styles = {
  content: {
    display: "flex",
    justifyContent: "center",
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
    position: "relative",
  },
  navbar: {
    background: "none",
    border: "none",
    color: "#FFFFFF",
    width: "480px",
    maxWidth: "100%",
    justifyContent: "center",
  },
  navbarItem: {
    borderColor: "#00E6B5",
  },
};

const App = ({ IS_PRODUCTION_MODE = true }) => {
  const [connectionTimeout, setConnectionTimeout] = useState();
  const [isTokenDataInitialized, setIsTokenDataInitialized] = useState();

  const { isWeb3Enabled, enableWeb3, isWeb3EnableLoading, chainId, isUnauthenticated } = useMoralis();
  const shouldConnectWallet = routeRequiresWalletConnection();

  useEffect(() => {
    const connectorId = window.localStorage.getItem("connectorId");
    if (!isWeb3Enabled && !isWeb3EnableLoading && shouldConnectWallet) {
      enableWeb3({ provider: connectorId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnauthenticated, isWeb3Enabled]); // TODO disable for initial page load (only trigger on route change, so that we don't hit people with a MM permission popup without their consent first)

  const contract = useMemo(() => contractsByChain[chainId], [chainId]);
  const tokens = useToken({ contract });

  const supportedChainIds = IS_PRODUCTION_MODE ? supportedProductionChainIds : supportedTestnetChainIds;

  useEffect(() => {
    const key = "cannot-connect";

    if ((!contract || isUnauthenticated) && shouldConnectWallet) {
      setConnectionTimeout(
        setTimeout(
          () =>
            message.info({
              key,
              content: (
                <span>
                  Click 'Connect wallet' or switch to a supported chain to get started. <CloseOutlined style={{ color: "#333333" }} />{" "}
                </span>
              ),
              duration: 10000,
              onClick: () => {
                message.destroy(key);
              },
            }),
          1000,
        ),
      );
    } else {
      clearTimeout(connectionTimeout);
      message.destroy(key);
    }
  }, [chainId, contract, isUnauthenticated]);

  useEffect(() => {
    if (isTokenDataInitialized || !shouldConnectWallet) {
      return;
    }

    (async () => {
      if (isWeb3Enabled && !isUnauthenticated && contract) {
        await tokens.methods.refreshTokenData();
        setIsTokenDataInitialized(true);
      }
    })();
  }, [isWeb3Enabled, isUnauthenticated, contract]);

  // TODO check dev-mode (isProductionMode in ../index.js) and display a warning banner at the top of the screen

  const WrapWithLayout = (props) => {
    return (
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
        <Fragment>
          {props.useAppHeader ? <AppHeader selectedNav={props.selectedNav} /> : <GenericHeader />}
          <div style={styles.content}>{props.children}</div>
          <Footer className="footer slow-show">
            <Logo />
          </Footer>
        </Fragment>
      </ErrorBoundary>
    );
  };

  const AppHeader = (props) => {
    return (
      <Header style={styles.header}>
        <Logo />
        <Menu mode="horizontal" selectedKeys={props.selectedNav} style={styles.navbar}>
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

  const DisconnectedWallet = () => (
    <ConfigProvider>
      <Layout style={{ height: "100vh", overflow: "auto" }} className="truefreeze gradient-bg disconnected-wallet">
        <WrapWithLayout useAppHeader={false}>
          <div className="skeleton-wrapper" styles={{ marginTop: "100px", width: "50%" }}>
            <Skeleton />
          </div>
        </WrapWithLayout>
      </Layout>
    </ConfigProvider>
  );

  function ErrorFallback({ error, resetErrorBoundary }) {
    return (
      <div role="alert" style={{ ...styles.content, flexDirection: "column", gap: "15px", maxWidth: "800px", marginLeft: "auto", marginRight: "auto" }} className="bg-white">
        <h1 className="uhoh">ERROR</h1>
        <p className="uhoh">Something went wrong:</p>
        <pre className="p-2">
          {error.name} {error.message}
        </pre>
        <Button type="primary" onClick={resetErrorBoundary}>
          Click to refresh the app.
        </Button>
      </div>
    );
  }

  if ((!contract || isUnauthenticated) && shouldConnectWallet) {
    return <DisconnectedWallet />;
  }

  return (
    <ConfigProvider>
      <PrefetchImages />
      <Layout style={{ height: "100vh", overflow: "auto" }} className="truefreeze gradient-bg">
        <Router>
          <Switch>
            <Route exact path="/landing">
              <WrapWithLayout useAppHeader={false}>
                <Landing />
              </WrapWithLayout>
            </Route>
            <Route exact path="/claim">
              <WrapWithLayout useAppHeader={false}>{isTokenDataInitialized && <Claim contract={contract} />}</WrapWithLayout>
            </Route>
            <Route exact path="/lock">
              <WrapWithLayout useAppHeader={true} selectedNav={"lock"}>
                <Lock tokens={tokens} contract={contract} />
              </WrapWithLayout>
            </Route>
            <Route exact path="/myfreezers">
              <WrapWithLayout useAppHeader={true} selectedNav={"myfreezers"}>
                <MyFreezers tokens={tokens} contract={contract} />
              </WrapWithLayout>
            </Route>
            <Route exact path="/stakeandburn">
              <WrapWithLayout useAppHeader={true} selectedNav={"stakeandburn"}>
                <StakeAndBurn tokens={tokens} contract={contract} />
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

export const PrefetchImages = () => (
  // tell the browser to download these backgrounds ahead of time to prevent flickering
  <div style={{ display: "none", position: "fixed" }}>
    <img width="1" height="1" src={gradientBgBlue} />
    <img width="1" height="1" src={gradientBgGreen} />
    <img width="1" height="1" src={gradientBgRed} />
  </div>
);

export const Logo = () => (
  <a href="/" className="tf-logo">
    <img src={logoSVG} />
  </a>
);

export const routeRequiresWalletConnection = (routeUrl) => {
  routeUrl = typeof routeUrl === "string" ? routeUrl : window.location.href; // use the current url if nothing passed in
  const noWalletRoutes = ["", "landing"];
  const route = routeUrl?.split("/")?.pop();
  return !noWalletRoutes.includes(route);
};

export default App;
