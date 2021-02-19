import { Button } from "react-bootstrap";
import React from "react";
import { connect } from "react-redux";
import { makeAndPushVC } from "../store";
import isMobile from "../helpers/isMobile";

class IssueBenefitButton extends React.Component {
  constructor(props) {
    super(props);
    this.dispatch = props.dispatch;
    this.session = props.session;
    this.hasRequiredAttributes = props.hasRequiredAttributes;
    this.vcIssuanceEndpoint = props.vcIssuanceEndpoint;
    this.vcType= props.vcType
    this.click = this.click.bind(this);
  }

  componentDidMount() {}

  click() {
    const vcType = this.props.vcType;
    console.log("IssueBenefitButton:: click called with session id " + this.props.uuid)
    let url = this.props.baseUrl
      ? `${this.props.baseUrl}benefit/issue?caseId=${this.props.caseId}`
      : `/benefit/issue?caseId=${this.props.caseId}`;
    // console.log(
    //   `will send request for ${url} with ${this.props.userSelection}, ty[e ${vcType} isMobile ${isMobile()}`
    // );
    this.props.sendVC(`${url}`, this.props.userSelection, vcType, this.props.uuid, isMobile(), this.props.caseId);
  }

  render() {
    return (
      <Button
        variant="primary"
        disabled={!this.props.hasRequiredAttributes}
        onClick={this.click}
      >
        Έκδοση Ταυτότητας
      </Button>
      // </Link>
    );
  }
}

function mapStateToProps(state) {
  return {
    status: state.sessionStatus
  };
}

const mapDispatchToProps = dispatch => {
  return {
    sendVC: (url, userSelection, vcType, uuid, isMobile, caseId) => {
      dispatch(makeAndPushVC(url, userSelection, vcType, uuid, isMobile, caseId));
    },
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(IssueBenefitButton);
