import landingImage from "../assets/landing_image_export.png";

function Landing() {
  return (
    <div className="landing-page page-scroll-container">
      <h1 className="landing-title">LOCK YOUR ETH AND EARN</h1>
      <h2 className="landing-subtitle">Get paid for your paitence. Earn from others' impatience.</h2>
      <a href="/app" className="white-button ">
        LAUNCH APP
      </a>
      <a href="/claim" className="white-button m-l-1">
        CHECK AIRDROP
      </a>
      <img className="landing-image" src={landingImage} />
    </div>
  );
}
export default Landing;
