import QrPrompt from "./QrPrompt";
import SSE from "./Sse.js";

const PairOrCard = (props) => {
  let unAuthorizedIssuance = (
    <div className={"row"}>
      <div
        className={"col"}
        style={{
          marginTop: "3rem",
          marginBottom: "3rem",
          textAlign: "center",
        }}
      >
        You are not authorized to receive such a Credential
      </div>
    </div>
  );

  let vcSentToUser = (
    <div className={"row"}>
      <div
        className={"col"}
        style={{
          marginTop: "3rem",
          marginBottom: "3rem",
          textAlign: "center",
        }}
      >
        <img
          alt=""
          src="../finished.png"
          style={{
            maxWidth: "15rem",
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        />
        <p>
          The Verifiable Credential has been succesfully sent to your Mobile!
          <br />
          Please check your uPort app notifications in order to <b>Accept</b> the Verifiable Credential
</p>
      </div>
    </div>
  );

  if (props.vcSent) {
    return vcSentToUser;
  }

  if (props.unauthorized){
    return unAuthorizedIssuance;
  }

  if (props.qrData && !props.DID) {
    let sseEndpoint = props.baseUrl
      ? `${props.endpoint}/${props.baseUrl}`
      : props.endpoint;
    return (
      <div>
        <QrPrompt
          qrData={props.qrData}
          message={
            `The service: "${props.issuer?props.issuer:"SBChain"} Issuer", is requesting the following permissions from your Uport App:`
          }
          permissions={["Receive Push Notification"]}
          baseUrl={props.baseUrl}
          issuer={props.issuer}
        />
        <SSE
          uuid={props.uuid}
          endpoint={sseEndpoint}
          serverSessionId={props.serverSessionId}
          sealSession={props.sealSession}
        />
      </div>
    );
  } else {
    if (props.DID) {
      if (props.selfForm && !props.formDataUploaded) {
        return props.selfForm;
      }

      return props.card;
    } else {
      return <div>Generating Pairing Request...</div>;
    }
  }
};

export default PairOrCard;
