import React from "react";

import {
  setSessionData,
  makeOnlyConnectionRequest,
  addSetToSelection,
  setStepperSteps,
  setEndpoint,
  setBaseUrl,
  completeDIDAuth,
  makeSealSession,
  makeSessionWithDIDConnecetionRequest,
  setSealSession,
  setEidasUriPort,
  setEidasRedirectUri,
  setUnauthorized
} from "../../../store";
import Layout from "../../../components/Layout";
import { connect } from "react-redux";
import { Button, Row, Col, Card, Container } from "react-bootstrap";
import MyStepper from "../../../components/Stepper";
import HomeButton from "../../../components/HomeButton";
import IssueBenefitButton from "../../../components/IssueBenefitButton";
import PairOrCard from "../../../components/PairOrCard";
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

class IssueBenefit extends React.Component {
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
    let caseId;
    if (typeof window === "undefined") {
      caseId = req.session.caseId;
      userSessionData = req.session.userData;
      console.log(`benefit.js setting endpoint to ${req.session.endpoint}`)
      reduxStore.dispatch(setEndpoint(req.session.endpoint));
      let baseUrl = req.session.baseUrl ? `/${req.session.baseUrl}/` : "";
      reduxStore.dispatch(setBaseUrl(baseUrl));
      DIDOk = req.session.DID;
      sealSession = req.session.sealSession;
      console.log(
        `benefit.js:: in the server the seal session is:: ${req.session.sealSession}`
      );
    } else {
      if (reduxStore.getState().sessionData) {
        userSessionData = reduxStore.getState().sessionData;
        DIDOk = reduxStore.getState().DID;
        //if ther is sessionData then there should be a session as well
        sealSession = reduxStore.getState().sealSession;
      
        // serverSessionId = reduxStore.getState().serverSessionId;
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

    console.log(`the endpoint is ${reduxStore.getState().endpoint}`)

    //returned value here is getting mered with the mapstatetoprops
    // mapstatetoprops overrides these values if they match
    return {
      sessionData: userSessionData,
      qrData: reduxStore.getState().qrData,
      vcSent: false,
      sealSession: reduxStore.getState().sealSession,
      caseId: caseId
      // endpoint : reduxStore.getState().endpoint,
    };
  }

  componentDidMount() {
    if (this.props.sessionData && this.props.sessionData.taxis) {
      let toSelect = [this.props.sessionData.taxis];
      this.props.setDataToSelection(toSelect);
    }

    if (!this.props.DID) {
      //if DID auth has not been completed
      if (!this.props.sealSession) {
        this.props.startSessionAndDidAuth(this.props.baseUrl, isMobile()); //and then makeConnectionRequest
      } else {
        this.props.makeConnectionRequest(
          this.props.sealSession,
          this.props.baseUrl,
          isMobile()
        );
      }
    }
    // on refresh unauthorized status must be checked
    this.props.setUnAuthorised(false);
  }

 
  proceedWithTaxisAuth() {
    let caseIdFrag = this.props.caseId !== undefined? `&&caseId=${this.props.caseId}`:""
    let sessionFrag = this.props.sealSession?`?session=${this.props.sealSession}${caseIdFrag}`:'';
    window.location.href = this.props.baseUrl === ""?`/SSI/benefit-authenticate${sessionFrag}`:
    `${this.props.endpoint}${this.props.baseUrl}SSI/benefit-authenticate${sessionFrag}`;
  }

  render() {
    let stepNumber = !this.props.DID ? 0 : this.hasRequiredAttributes ? 2 : 1;
    let stepperSteps = [
      { title: "Συνδέστε το κινητό σας" },
      { title: 'Ταυτοποιηθείτε μέσω του TAXIS_ID VC' },
      { title: "Έκδοση Ηλεκτρονικής Ταυτότητας" },
    ];



    if (this.props.qrData && isMobile() && !this.props.DID) {
      return (
        <Layout>
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

    let taxisLoginButton = !this.hasRequiredAttributes ? (
      <Button onClick={this.proceedWithTaxisAuth}>TAXISnet login</Button>
    ) : (
      <Button variant="primary" disabled>
        Authenticate
      </Button>
    );

    let issueVCBut = (
      <IssueBenefitButton
        hasRequiredAttributes={this.hasRequiredAttributes}
        baseUrl={this.props.baseUrl}
        userSelection={this.props.userSelection}
        uuid={this.props.sealSession}
        caseId={this.props.caseId}
        vcType={"BENEFIT"}
      />
    );

    let eidasCard = (
      <Card className="text-center" style={{ marginTop: "2rem" }}>
        <Card.Header>Issue a Verifiable Credential allowing you to access special discounts</Card.Header>
        <Card.Body>
          <Card.Title>
            {this.hasRequiredAttributes
             ? "Η έκδοση της Ηλεκτρονικής σας Ταυτότητας είναι έτοιμη!"
             : "Παρακαλώ ταυτοποιηθείτε στις απαιτούμενες πηγές"}
          </Card.Title>
          <Card.Text>
          Μολις ταυτοποιηθείτε με τις εξουσιοδοτημένες πηγές, πατήστε το κουμπί "Έκδοση" για να δημιουργήσετε την ταυτοτητά σας.
          </Card.Text>
          <Container>
            <Row>
              <Col>{taxisLoginButton}</Col>
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
        serverSessionId={this.props.sealSession}
        card={eidasCard}
        vcSent={this.props.vcSent}
        sealSession={this.props.sealSession}
        unauthorized = {this.props.unauthorized}
      />
    );

    return (
      <Layout>
        <Row>
          <Col>
            <MyStepper steps={stepperSteps} activeNum={stepNumber} />
          </Col>
        </Row>
        {result}

        <Row>
          <HomeButton baseUrl={this.props.baseUrl} />
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
    unauthorized : state.appReducer.unauthorized
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    setDataToSelection: (set) => {
      dispatch(addSetToSelection(set));
    },
    setSteps: (steps) => {
      dispatch(setStepperSteps(steps));
    },
    setEndPoint: (endpoint) => {
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

    setUnAuthorised : (value) =>{
      dispatch(setUnauthorized(value));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(IssueBenefit);
