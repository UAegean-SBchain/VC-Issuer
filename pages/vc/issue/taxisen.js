import React from "react";
import axios from "axios";
import {
  setSessionData,
  makeOnlyConnectionRequest,
  addSetToSelection,
  setStepperSteps,
  setEndpoint,
  setBaseUrl,
  // setServerSessionId,
  completeDIDAuth,
  makeSealSession,
  makeSessionWithDIDConnecetionRequest,
  setSealSession,
  setEidasUriPort,
  setEidasRedirectUri,
} from "../../../store";
import Layout from "../../../components/Layout";
import { connect } from "react-redux";
import { Button, Row, Col, Card, Container } from "react-bootstrap";
import MyStepper from "../../../components/Stepper";
import HomeButton from "../../../components/HomeButton";
import IssueVCButton from "../../../components/IssueVCButton";
import PairOrCard from "../../../components/PairOrCardEn";
import isMobile from "../../../helpers/isMobile";
import ConnectMobile from "../../../components/ConnectMobile"

const transport = require("uport-transports").transport;
/*
  Secure flow:
  - check in session if DID is present. This is not only the DID of the user but the whole connection response
  - if it is not present:
    - first display DID connection request (QR etc.). The DID response endpoint should contain the session here
    - on response on the server, send a SSE to the front end, denoting that DID auth is completed and on the server there is the DID component
    - Display additional datasources
    - on VC issance request, do not display QR code etc, but send the credentials straigth to the users wallet

*/

class IssueAmka extends React.Component {
  constructor(props) {
    super(props);
    this.dispatch = props.dispatch;
    this.isFetching = props.isFetching;
    this.sessionData = props.sessionData;
    this.proceedWithTaxisAuth = this.proceedWithTaxisAuth.bind(this);
    this.hasRequiredAttributes =
      props.sessionData !== null &&
      props.sessionData !== undefined &&
      props.sessionData.taxis !== undefined;
  }

  static async getInitialProps({ reduxStore, req }) {
    let userSessionData;
    let DIDOk;
    let sealSession;
    if (typeof window === "undefined") {
      userSessionData = req.session.userData;
      reduxStore.dispatch(setEndpoint(req.session.enpoint));
      let baseUrl = req.session.baseUrl ? `/${req.session.baseUrl}/` : "";
      reduxStore.dispatch(setBaseUrl(baseUrl));
      DIDOk = req.session.DID;
      sealSession = req.session.sealSession;

      console.log(
        `taxis.js:: in the server the seal session is:: ${req.session.sealSession}`
      );
    } else {
      if (reduxStore.getState().sessionData) {
        userSessionData = reduxStore.getState().sessionData;
        DIDOk = reduxStore.getState().DID;
        //if ther is sessionData then there should be a session as well
        sealSession = reduxStore.getState().sealSession;
      } else {
        console.log(`no server session data found`);
      }
    }

    //this way the userSessionData gets set in all settings
    if (userSessionData) {
      reduxStore.dispatch(setSessionData(userSessionData));
    }
    if (DIDOk) {
      reduxStore.dispatch(completeDIDAuth(sealSession));
      reduxStore.dispatch(setSealSession(sealSession));
    }

    //returned value here is getting mered with the mapstatetoprops
    // mapstatetoprops overrides these values if they match
    return {
      sessionData: userSessionData,
      qrData: reduxStore.getState().qrData,
      vcSent: false,
      sealSession: reduxStore.getState().sealSession,
    };
  }

  componentDidMount() {
    if (this.props.sessionData && this.props.sessionData.taxis) {
      let toSelect = [this.props.sessionData.taxis];
      this.props.setTaxisToSelection(toSelect);
    }

    if (!this.props.DID) {
      //if DID auth has not been completed
      if (!this.props.sealSession) {
        console.log(`Component did mount isMobile ${isMobile()}`);
        this.props.startSessionAndDidAuth(
          this.props.baseUrl,
          isMobile()
        ); //and then makeConnectionRequest
      } else {
        console.log(`Component didΜount no DID isMobile ${isMobile()}`);
        this.props.makeConnectionRequest(
          this.props.sealSession,
          this.props.baseUrl,
          isMobile()
        );
      }
    }
  }

 
  proceedWithTaxisAuth() {
    let sessionFrag = this.props.sealSession?`?session=${this.props.sealSession}`:'';
    window.location.href = this.props.baseUrl?`${this.props.baseUrl}taxis/taxisen-authenticate${sessionFrag}`:`
    ${this.props.baseUrl}/taxis/taxisen-authenticate${sessionFrag}`;
  }

  render() {
    let stepNumber = !this.props.DID ? 0 : this.hasRequiredAttributes ? 2 : 1;
    let stepperSteps = [
      { title: "Pair your SSI Wallet" },
      { title: 'Authenticate over TAXISnet eID' },
      { title: "Issue your Verifiable Credential" },
    ];



    if (this.props.qrData && isMobile() && !this.props.DID) {
      return (
        <Layout text={"UAegean Issuer"}>
          <Row>
            <Col>
              <MyStepper steps={stepperSteps} activeNum={stepNumber} />
            </Col>
          </Row>
          <ConnectMobile
            baseUrl={this.props.baseUrl}
            qrData={this.props.qrData}
            DID={this.props.DID}
            uuid={this.props.uuid}
            serverSessionId={this.props.uuid}
            sealSession={this.props.uuid}
          />
        </Layout>
      );

     
    }

    let amkaLoginButton = !this.hasRequiredAttributes ? (
      <Button onClick={this.proceedWithTaxisAuth}>TAXISnet eID</Button>
    ) : (
      <Button variant="primary" disabled>
        TAXISnet eID
      </Button>
    );

    let issueVCBut = (
      <IssueVCButton
        hasRequiredAttributes={this.hasRequiredAttributes}
        // vcIssuanceEndpoint={"/issueVCSecure"}
        baseUrl={this.props.baseUrl}
        userSelection={this.props.userSelection}
        uuid={this.props.sealSession}
        vcType={"TAXIS"}
        text={"Issue"}
      />
    );

    let eidasCard = (
      <Card className="text-center" style={{ marginTop: "2rem" }}>
          <Card.Header style={{"fontSize": "1.5rem"}}>Generate a Verifiable Credential attesting to your eID attributes retrieved over TAXISnet
</Card.Header>
        <Card.Body>
          <Card.Title style={{"fontSize": "1.5rem"}}>
            {this.hasRequiredAttributes
            ? "All required Data have been retrieved!"
            : "Please authenticate over the requested Data Sources"}
          </Card.Title>
          <Card.Text style={{"fontSize": "1.3rem"}}>
          {this.hasRequiredAttributes
               ? `Click now the "Issue" button to receive a Verifiable Credential made of your eID attributes`
               : ` Once you complete your TAXISnet eID authentication, click the "Issue" button to generate a Verifiable Credential from your eID attributes.
               `}
         
         
          </Card.Text>
          <Container>
            <Row>
              <Col>{amkaLoginButton}</Col>
              <Col>{issueVCBut}</Col>
            </Row>
          </Container>
        </Card.Body>
        {/* <Card.Footer className="text-muted">2 days ago</Card.Footer> */}
      </Card>
    );
   

    let result = (
      <PairOrCard
        qrData={this.props.qrData}
        DID={this.props.DID}
        baseUrl={this.props.baseUrl}
        uuid={this.props.uuid}
        serverSessionId={this.props.uuid}
        card={eidasCard}
        vcSent={this.props.vcSent}
        sealSession={this.props.uuid}
        issuer={"UAegean"}
      />
    );

    return (
      <Layout text={"UAegean Issuer"}>
        <Row>
          <Col>
            <MyStepper steps={stepperSteps} activeNum={stepNumber} />
          </Col>
        </Row>
        {result}

        <Row>
          <HomeButton baseUrl={this.props.baseUrl} text={"Home"}  />
        </Row>
      </Layout>
    );
  }
}
function mapStateToProps(state) {
  return {
    isFetching: state.appReducer.fetching,
    qrData: state.appReducer.qrData,
    sessionData: state.appReducer.sessionData,
    userSelection: state.appReducer.userSelection, // the attributes selected by the user to be included in a VC,
    baseUrl: state.appReducer.baseUrl,
    DID: state.appReducer.DID,
    // serverSessionId: state.serverSessionId,
    uuid: state.appReducer.uuid,
    vcSent: state.appReducer.vcSent,
    sealSession: state.appReducer.sealSession,
    eidasUri: state.appReducer.eidasUri,
    eidasPort: state.appReducer.eidasPort,
    endpoint: state.appReducer.endpoint,
    eidasRedirectUri: state.appReducer.eidasRedirectUri,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    setTaxisToSelection: (set) => {
      dispatch(addSetToSelection(set));
    },
    setSteps: (steps) => {
      dispatch(setStepperSteps(steps));
    },
    setEndPoint: (endpont) => {
      dispatch(setEndpoint(endpoint));
    },
    makeConnectionRequest: (sealSession, baseUrl, isMobile) => {
      dispatch(makeOnlyConnectionRequest(sealSession, baseUrl, isMobile));
    },
    didAuthOK: (uuid) => {
      dispatch(completeDIDAuth(uuid));
    },
    startSealSession: (baseUrl) => {
      dispatch(makeSealSession(baseUrl));
    },
    startSessionAndDidAuth: (baseUrl, isMobile) => {
      dispatch(makeSessionWithDIDConnecetionRequest(baseUrl, isMobile));
    },
    setTheSealSession: (sessionId) => {
      dispatch(setSealSession(sessionId));
    },
    setEidas: (uri, data) => {
      dispatch(setEidasUriPort(uri, data));
    },

    setEidasRedirect: (uri) => {
      dispatch(setEidasRedirectUri(uri));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(IssueAmka);
