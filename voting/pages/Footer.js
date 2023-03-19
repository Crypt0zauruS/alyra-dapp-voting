const Footer = () => {
    const year = new Date().getFullYear();
  
    return <footer className="footer container-fluid">{`Copyright © Maxence & Sylvain ${year}`}</footer>;
  };
  
  export default Footer;