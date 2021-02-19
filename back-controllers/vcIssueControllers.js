import axios from "axios";
const { Credentials } = require("uport-credentials");
const pushTransport = require("uport-transports").transport.push;
const crypto = require("crypto");
import { Resolver } from "did-resolver";
import { getResolver } from "ethr-did-resolver";
import { uuid } from "uuidv4";
import { uintToBase36 } from "base36id";
import { formatCredentialData } from '../helpers/CredentialHelper'

import {
  updateSessionData,
  startSession,
  getSessionData,
} from "../back-services/sessionServices";

import { publish } from "../back-services/server-sent-events";
import { generateCredentialModel } from "../model/credentialModel";
import { mySigner } from "../back-services/hsmSigner";

const providerConfig = {
  rpcUrl: "https://mainnet.infura.io/v3/051806cbbf204a4886f2ab400c2c20f9",
};
const resolver = new Resolver(getResolver(providerConfig));

const credentials = new Credentials({
  appName: "MyIssuer",
  did: "did:ethr:0xd502a2c71e8c90e82500a70683f75de38d57dd9f",
  signer: mySigner,
  resolver,
});

function validate(req, res) {
  const msToken = req.query.msToken;
  res.send(validateToken(msToken));
}

async function update(req, res) {
  const sessionId = req.body.sessionId;
  const variableName = req.body.variableName;
  const variableValue = req.body.variableValue;
  res.send(updateSessionData(sessionId, variableName, variableValue));
}

async function makeSession(req, res) {
  console.log("vcIssueControllers makeSession");
  let response = await startSession();
  res.send(response);
}

async function makeToken(req, res) {
  console.log("vcIssueControllers makeToken");
  //sessionId, sender, receiver
  let response = await generateToken(
    req.query.sessionId,
    req.query.sender,
    req.query.receiver
  );
  res.send(response);
}

/*
 Accepts:
   - post param: data containing the user VC requested data
  Gets from session:
   - the received user attributes
  Gets from the cache, using the session (uuid) of the client:
   - the DID auth response
  and pushes to the wallet of the user the VC based on the retrieved attributes  
*/
async function sealIssueVC(req, res) {
  const requestedData = req.body.data;
  const vcType = req.body.vcType;
  const sealSession = req.body.sealSession;
  console.log(`vcIssueControllers sealIssueVC -- seal session ${sealSession}`);
  let dataStore = await getSessionData(sealSession, "dataStore");
  console.log(`vcIssueControllers sealIssueVC -- dataStore::`);
  console.log(dataStore);
  let didResp = await getSessionData(sealSession, "DID");
  didResp = JSON.parse(didResp);
  // GET data from SM, parse them in the form of userSessionData, and proceed with the issuance
  let fetchedData = dataStore;
  let vcData = generateCredentialModel(requestedData, fetchedData, vcType);
  vcData.id = uintToBase36(Math.floor(Math.random() * Math.floor(100000000)));
  let expirationInMonths = process.env.EXPIRE_MONTHS
    ? process.env.EXPIRE_MONTHS
    : 3;
  vcData = formatCredentialData(vcData, vcType)

  console.log("vcIssueControllers:: will issue credential")
  console.log(vcData)


  let date = new Date();
  let expirationDate = new Date(date.setMonth(date.getMonth() + expirationInMonths));

  credentials
    .createVerification({
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
      ],
      "type": ["VerifiableCredential", "eIDASCredential"],
      sub: didResp.did,
      "issuer": "University of the Aegean",
      "issuanceDate":  (Math.floor((new Date()).getTime() / 1000) + 30 * 24 * 60 * 60),
      exp:
        (Math.floor(expirationDate.getTime() / 1000) + 30 * 24 * 60 * 60),
      claim: vcData,
      vc: ["/ipfs/QmWLCkXmpQSQG6kcf88kZbNCRHFbfZzHG8hSbdn7QndQTL"],
    })
    .then((attestation) => {
      let push = pushTransport.send(didResp.pushToken, didResp.boxPub);
      console.log(
        `vcIssueControllers.js -- sealIssueVC:: pushingn to wallet::`
      );
      console.log("!!!!The credential beingn pushed is!!!!: ");
      console.log(attestation);
      return push(attestation);
    })
    .then((pushed) => {
      console.log(
        `vcIssueControllers.js -- sealIssueVC:: user should receive claim in any moment`
      );
      publish(JSON.stringify({ uuid: sealSession, status: "sent" }));
      res.send(200);
    });
}

async function issueBenefitVC(req, res) {
  const requestedData = req.body.data;
  const vcType = req.body.vcType;
  const sealSession = req.body.sealSession;
  console.log(
    `vcIssueControllers issueBenefitVC -- seal session ${sealSession}`
  );
  // console.log(`caseId = ${req.body.caseId}`);
  let dataStore = await getSessionData(sealSession, "dataStore");
  console.log(`vcIssueControllers issueBenefitVC -- dataStore::`);
  console.log(dataStore);
  let didResp = await getSessionData(sealSession, "DID");
  didResp = JSON.parse(didResp);
  // GET data from SM, parse them in the form of userSessionData, and proceed with the issuance
  let fetchedData = dataStore;
  //check if the user is entitled to a benefit
  let sbchainBackend = process.env.SBCHAIN_URL
    ? process.env.SBCHAIN_URL
    : "http://localhost:8080";
  let nonce = await axios.get(`${sbchainBackend}/rest/nonce`).then((resp) => {
    // console.log(`the data from the axios call is `);
    // console.log(resp.data);
    return resp.data;
  });
  // console.log(`the nonce is `)
  // console.log(nonce);
  let salt = process.env.SBCHAIN_SALT ? process.env.SBCHAIN_SALT : "salt";
  let hashed = crypto
    .createHash("sha256")
    .update(nonce + salt)
    .digest("hex");

  let response = await axios
    .get(
      `${sbchainBackend}/rest/isBeneficiary?nonce=${nonce}&hashed=${hashed}&afm=${dataStore["TAXIS"].afm}`
    )
    .then((resp) => {
      return resp.data;
    });

  console.log(response);

  if (response) {
    console.log(`vcIssueControllers.js -- issueBenefitVC:: vcData::`);
    let vcData = { BENEFIT: { isBeneficiary: true, caseId: req.body.caseId } };
    console.log(vcData);
    credentials
      .createVerification({
        sub: didResp.did,
        exp: Math.floor(new Date().getTime() / 1000) + 30 * 24 * 60 * 60,
        claim: vcData,
        vc: ["/ipfs/QmWLCkXmpQSQG6kcf88kZbNCRHFbfZzHG8hSbdn7QndQTL"],
      })
      .then((attestation) => {
        let push = pushTransport.send(didResp.pushToken, didResp.boxPub);
        console.log(
          `vcIssueControllers.js -- issueBenefitVC:: pushingn to wallet::`
        );
        console.log(attestation);
        return push(attestation);
      })
      .then((pushed) => {
        console.log(
          `vcIssueControllers.js -- issueBenefitVC:: user should receive claim in any moment`
        );
        publish(JSON.stringify({ uuid: sealSession, status: "sent" }));
        res.send(200);
      });
  } else {
    res.send(403);
  }
}




async function issueEndorsedEBill(req, res, didResp, attributes) {

  console.log(`vcIssueControllers issueEndorsedEBill `);

  attributes.id = uintToBase36(Math.floor(Math.random() * Math.floor(100000000)));
  let expirationInMonths = process.env.EXPIRE_MONTHS
    ? process.env.EXPIRE_MONTHS
    : 3;

  let date = new Date();
  let expirationDate = new Date(date.setMonth(date.getMonth() + expirationInMonths));

  // console.log("didResp")
  // console.log(didResp)
  // console.log("attributes")
  // console.log(attributes)


  let vc = {
    EBILL: {
      ebill: attributes
    }
  }


  console.log("vcIssueControllers:: will issue credential")
  console.log(vc)

  credentials
    .createVerification({
      sub: didResp.did,
      exp:
        (Math.floor(expirationDate.getTime() / 1000) + 30 * 24 * 60 * 60),
      claim: formatCredentialData(vc, "EBILL"),
      vc: ["/ipfs/QmWLCkXmpQSQG6kcf88kZbNCRHFbfZzHG8hSbdn7QndQTL"],
    })
    .then((attestation) => {
      let push = pushTransport.send(didResp.pushToken, didResp.boxPub);
      console.log(
        `vcIssueControllers.js -- issueEndorsedEBill:: pushingn to wallet::`
      );
      return push(attestation);
    })
    .then((pushed) => {
      console.log(
        `vcIssueControllers.js -- issueEndorsedEBill:: user should receive claim in any moment`
      );
      // publish(JSON.stringify({ uuid: null, status: "sent" }));
      res.send(200);
    });
}



async function issueEndorsedContact(req, res, didResp, attributes) {
  console.log(`vcIssueControllers issueEndorsedContact `);
  attributes.id = uintToBase36(Math.floor(Math.random() * Math.floor(100000000)));
  let expirationInMonths = process.env.EXPIRE_MONTHS
    ? process.env.EXPIRE_MONTHS
    : 3;
  let date = new Date();
  let expirationDate = new Date(date.setMonth(date.getMonth() + expirationInMonths));

  // console.log("didResp")
  // console.log(didResp)
  // console.log("attributes")
  // console.log(attributes)


  let vc = {
    Contact: {
      contact: attributes
    }
  }
  credentials
    .createVerification({
      sub: didResp.did,
      exp:
        (Math.floor(expirationDate.getTime() / 1000) + 30 * 24 * 60 * 60),
      claim: formatCredentialData(vc, "CONTACT"),
      vc: ["/ipfs/QmWLCkXmpQSQG6kcf88kZbNCRHFbfZzHG8hSbdn7QndQTL"],
    })
    .then((attestation) => {
      let push = pushTransport.send(didResp.pushToken, didResp.boxPub);
      console.log(
        `vcIssueControllers.js -- issueEndorsedEBill:: pushingn to wallet::`
      );
      return push(attestation);
    })
    .then((pushed) => {
      console.log(
        `vcIssueControllers.js -- issueEndorsedEBill:: user should receive claim in any moment`
      );
      // publish(JSON.stringify({ uuid: null, status: "sent" }));
      res.send(200);
    });
}



export {
  makeSession,
  update,
  validate,
  makeToken,
  sealIssueVC,
  issueBenefitVC,
  issueEndorsedEBill,
  issueEndorsedContact
};
