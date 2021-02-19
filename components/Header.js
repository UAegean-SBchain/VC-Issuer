import Link from "next/link";
import { Container, Navbar } from "react-bootstrap";

const linkStyle = {
  marginRight: 15
};

const Header = props =>{
  const text = props.text?props.text:"Social Solidarity Income VC Issuer"

  return (
    <Container fluid>
      <Navbar expand="sm" bg="dark" variant="dark" >
        <Navbar.Brand href="/">
          {/* <img
            alt=""
            src="/gunet_logo.png"
            width="100"
            height="40"
            className="d-inline-block align-top"
          />{" "} */}
           {text}
        </Navbar.Brand>
      </Navbar>
    </Container>
  );
} 

export default Header;
