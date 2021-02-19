import React from "react";
import axios from "axios";

import {
  setStepperSteps,
  setEndpoint,
  setBaseUrl,
  setEndorsement,
  setSealSession,
} from "../../../store";
import Layout from "../../../components/Layout";
import { connect } from "react-redux";
import { Button, Row, Col, Card, Container } from "react-bootstrap";
import MyStepper from "../../../components/Stepper";
import HomeButton from "../../../components/HomeButton";
import IssueVCButton from "../../../components/IssueVCButton";
import PairOrCard from "../../../components/PairOrCard";
import EndorsedEBillForm from "../../../components/endorserEBillForm";

class AuthorizeEbill extends React.Component {
  constructor(props) {
    super(props);
    this.dispatch = props.dispatch;
    this.isFetching = props.isFetching;
    this.sessionData = props.sessionData;
    this.hasRequiredAttributes =
      props.sessionData !== null &&
      props.sessionData !== undefined &&
      props.sessionData.ebill !== undefined;

    this.state = { error: null, vcSent: false };
  }

  static async getInitialProps({ reduxStore, req }) {
    let endorsement;
    let sealSession;
    if (typeof window === "undefined") {
      endorsement = req.session.endorsement;
      reduxStore.dispatch(setEndorsement(req.session.endorsement));
      reduxStore.dispatch(setEndpoint(req.session.enpoint));
      let baseUrl = req.session.baseUrl ? `/${req.session.baseUrl}/` : "";
      reduxStore.dispatch(setBaseUrl(baseUrl));
      sealSession = req.session.sessionId;
      reduxStore.dispatch(setSealSession(sealSession));
    } else {
      endorsement = reduxStore.getState().endorsement;
      sealSession = reduxStore.getState().sealSession;
    }

    //this way the userSessionData gets set in all settings
    if (endorsement) {
      reduxStore.dispatch(setEndorsement(endorsement));
    }

    //returned value here is getting mered with the mapstatetoprops
    // mapstatetoprops overrides these values if they match
    return {
      endorsement: endorsement,
      sealSession: reduxStore.getState().sealSession,
      // error: null,
    };
  }

  // componentDidMount() {
  //   if (!this.props.DID) {
  //     //if DID auth has not been completed
  //     if (!this.props.sealSession) {
  //       this.props.startSessionAndDidAuth(this.props.baseUrl, isMobile()); //and then makeConnectionRequest
  //     } else {
  //       this.props.makeConnectionRequest(
  //         this.props.sealSession,
  //         this.props.baseUrl,
  //         isMobile()
  //       );
  //     }
  //   }
  // }

  submit = (values) => {
    // console.log("authorize-ebill values")
    // console.log(values);
    // console.log(`the session is ${this.props.sealSession}`)
    let verificationId = values.verification;
    // console.log(``)
    // values.source = "ebill";
    // let toSelect = [values];
    // this.props.setSefToSelection(toSelect);
    //this.props.baseUrl?`${this.props.baseUrl}eidas/eidas-authenticate${sessionFrag}`:`${this.props.baseUrl}/eidas/eidas-authenticate${sessionFrag}`;
    let uri = this.props.baseUrl ? `${this.props.baseUrl}endorse/ebill/authorization?verification=${verificationId}&session=${this.props.sealSession}` :
      `/endorse/ebill/authorization?verification=${verificationId}&session=${this.props.sealSession}`;
    axios
      .get(uri)
      .then((data) => {
        this.setState({
          vcSent: true
        });
      })
      .catch((error) => {
        console.log(error);
        this.setState({
          error: true,
        });
      });
  };

  render() {
    let stepNumber = 0;
    let stepperSteps = [
      { title: "Επιβεβαιώστε τα κάτωθι στοιχεία" },
      // { title: "Declare Self Attested Attributes" },
    ];

    let issueVCBut = (
      <IssueVCButton
        hasRequiredAttributes={
          this.props.sessionData !== null &&
          this.props.sessionData !== undefined &&
          this.props.sessionData.ebill !== undefined
        }
        baseUrl={this.props.baseUrl}
        userSelection={this.props.userSelection}
        uuid={this.props.sealSession}
        vcType={"EBILL"}
      />
    );

    let theCard = (
      <Card className="text-center" style={{ marginTop: "2rem" }}>
        <Card.Header>
          Επιβαιβέωση στοιχείων για έκδοση Πιστοποιητικού
        </Card.Header>
        <Card.Body>
          <Card.Title>
            {this.hasRequiredAttributes
              ? "Credentials Issuance is ready!"
              : "Please authenticate to the required data sources"}
          </Card.Title>
          <Card.Text>
            Ολοκληρώσατε την αίτηση επιβαιβέωσης των στοιχείων που δηλώσατε.
            Μόλις, τα στοιχεία επιβεβαιωθούν από τον αρμόδιο φορέα, όπως εσείς
            τον δηλώσατε, το αντίστοιχο πιστοποιητικό (Verifiable Credential) θα
            σταλεί στο κινητό σας.
          </Card.Text>
          <Container>
            {/* <Row>
              <Col>{issueVCBut}</Col>
            </Row> */}
          </Container>
        </Card.Body>
      </Card>
    );

    let result = this.state.error ? (
      <div style={{ marginTop: "3rem" }}>
        Η υπεύθυνη δήλωση που παρείχατε δεν πιστοποιεί τις ζητούμενες
        διαπιστεύσεις
      </div>
    ) :
      this.state.vcSent ? (
        <div style={{ marginTop: "3rem" }}>
          Το διαπιστευτήριον έχει αποσταλεί στο κινητό του χρήστη με επιτυχία
        </div>
      ) :

        (
          <PairOrCard
            qrData={this.props.qrData}
            DID={this.props.DID}
            baseUrl={this.props.baseUrl}
            uuid={this.props.uuid}
            serverSessionId={this.props.sealSession}
            card={theCard}
            vcSent={this.props.vcSent}
            sealSession={this.props.sealSession}
            formDataUploaded={
              this.props.sessionData !== null &&
              this.props.sessionData !== undefined &&
              this.props.sessionData.ebill !== undefined
            }
            selfForm={
              <EndorsedEBillForm
                onSubmit={this.submit}
                endorsed={this.props.endorsement}
              />
            }
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
    sessionData: state.appReducer.sessionData,
    DID: true,
    sealSession: state.appReducer.sealSession,
    baseUrl: state.appReducer.baseUrl
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    setSteps: (steps) => {
      dispatch(setStepperSteps(steps));
    },
    setEndPoint: (endpont) => {
      dispatch(setEndpoint(endpoint));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(AuthorizeEbill);
