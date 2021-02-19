# SBchain VC Issuer

The SBchain VC Issuer implements a Verifiable Credential (VC) Issuer capable of communicating with a user's uPort Self Sovreign Identitiy wallet. This service  plays a key role in the SBchain system, as the holders of these crednetials can later use them to access various services, primarily the Social Solidarity Income Web Application System (https://github.com/UAegean-SBchain/SBchain-Web-App) with no direct interaction with the Issuer. 

To issue these Credentials, the Issuer integrates with various authoritative sources. The integration is implemented in a complete privacy-preserving manner with no persistence layer controlled by the system to store the data of the users. Additionally, this approach enables a complete trust in the user’s ownership over the generated credentials as well cryptographic trust in their validity. 

As a result the issued Credentials can be utilized in a plethora of use cases, which might not be directly  related to the project, but can significantly reduce red tape and generate cross-domain system integration and trust (e.g. registration at a telecom operator). 

The code contained within this repository was developed by the University of the Aegean during the ultra-Social Benefits Transparency & Accountability (ultra-SocBenTΑ) project. This project was funded by Siemens via Settlement Agreement with Hellenic Republic