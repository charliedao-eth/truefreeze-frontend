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
import { CaretLeftFilled, CloseOutlined } from "@ant-design/icons";
import "antd/dist/antd.variable.min.css";
const { Header, Footer } = Layout;
import logoSVG from "./assets/truefreezelogo.svg";
import gradientBgBlue from "./assets/gradientbgblue.png";
import gradientBgGreen from "./assets/gradientbggreen.png";
import gradientBgRed from "./assets/gradientbgred.png";

export const DOCS_URL = "https://deepfreezellc.gitbook.io/true-freeze";
export const FAQS_URL = "https://deepfreezellc.gitbook.io/true-freeze/faqs";
export const AUDIT_URL = "https://deepfreezellc.gitbook.io/true-freeze/key-info/audited-by-solidity.finance";
export const LIQUIDITY_URL = "https://curve.fi/factory-crypto/65/deposit";

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
          {props.useFooter !== false && (
            <Footer className="footer slow-show">
              <Logo url="/app" />
              <div className="footer-links">
                <a className="footer-item" href={FAQS_URL} rel="noreferrer" target="_blank">
                  FAQs
                </a>
                <a className="footer-item" href={AUDIT_URL} rel="noreferrer" target="_blank">
                  Audit
                </a>
                <a className="footer-item" href={LIQUIDITY_URL} rel="noreferrer" target="_blank">
                  Liquidity
                </a>
              </div>
              <a href="/compatibility" className="legalese">
                Having trouble? Try compatibility mode.
              </a>
            </Footer>
          )}
        </Fragment>
      </ErrorBoundary>
    );
  };

  const AppHeader = (props) => {
    return (
      <Header className="tf-header">
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
          <a className="header-item" href={"/claim"}>
            Claim
          </a>
          <a className="header-item" href={DOCS_URL}>
            Docs
          </a>
          <Chains supportedChainIds={supportedChainIds} />
          <Account />
        </div>
      </Header>
    );
  };

  const GenericHeader = () => (
    <Header className="tf-header">
      <Logo />
      <div style={styles.headerRight}>
        <a className="header-item" href={"/claim"}>
          Claim
        </a>
        <a className="header-item" href={DOCS_URL}>
          Docs
        </a>
        <a className="header-item" href="/app">
          Launch
        </a>
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
    if (!(window?.location?.href?.indexOf("/app") < 0 || window?.location?.href?.indexOf("/lock") < 0)) {
      // don't show this on the lock page
      return <DisconnectedWallet />;
    }
  }

  return (
    <ConfigProvider>
      <PrefetchImages />
      <Layout style={{ height: "100vh", overflow: "auto" }} className="truefreeze gradient-bg">
        <Router>
          <Switch>
            <Route exact path="/compatibility">
              <div className="compatibility-mode p-1">
                <a href="/app">
                  <CaretLeftFilled /> Exit compatibility mode
                </a>
                <div className="flex space-between m-b-1 m-t-1">
                  <Chains supportedChainIds={supportedChainIds} />
                  <Account />
                </div>
                <h2>Lock</h2>
                <Lock tokens={tokens} contract={contract} compatibilityMode={true} />
                <h2>My Freezers</h2>
                <MyFreezers tokens={tokens} contract={contract} compatibilityMode={true} />
                <h2>Burn, stake, and rewards</h2>
                <StakeAndBurn tokens={tokens} contract={contract} compatibilityMode={true} />
                {isTokenDataInitialized && <Claim contract={contract} compatibilityMode={true} />}
              </div>
            </Route>
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

export const Logo = ({ url = "/" }) => (
  <a href={url} className="tf-logo">
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
