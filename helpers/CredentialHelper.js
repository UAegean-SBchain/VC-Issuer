function formatCredentialData(vcData, vcType) {
  console.log('credentialHelper.js:: GOT THE VC TYPE ' + vcType)

  if (vcType.toUpperCase().trim() === "TAXIS") {
    return formatTaxisClaim(vcData);
  }

  if (vcType.toUpperCase().trim() === "EBILL") {
    return formatEbillClaim(vcData);
  }

  if (vcType.toUpperCase().trim() === "CONTACT") {
    return formatContactClaim(vcData);
  }

  if (vcType.toUpperCase().trim() === "E1") {
    return formatFinancialIDClaim(vcData);
  }

  if (vcType.toUpperCase().trim() === "MITRO") {
    return formatCivilIDClaim(vcData)
  }

  if(vcType.toUpperCase().trim()==="SELF"){
    return formatPersonalDeclarationClaim(vcData)
  }

  if(vcType.toUpperCase().trim()==="EIDAS"){
    return formatEidasClaim(vcData)
  }

  return vcData;
}

function formatTaxisClaim(vcData) {
  return {
    TAXIS_ID: {
      claims: {
        afm: vcData.TAXIS.TAXIS.afm,
        firstName: vcData.TAXIS.TAXIS.fistName,
        lastName: vcData.TAXIS.TAXIS.lastName,
        fathersName: vcData.TAXIS.TAXIS.fathersName,
        mothersName: vcData.TAXIS.TAXIS.mothersName,
        yearOfBirth: vcData.TAXIS.TAXIS.dateOfBirth,
      },
      metadata: {
        source: vcData.TAXIS.TAXIS.source,
        id: vcData.id,
      },
    },
  };
}

function formatEidasClaim(vcData) {
  return {
    "eidas-eID": {
      attributes: {
        firstName: vcData.EIDAS.eIDAS.fistName,
        lastName: vcData.EIDAS.eIDAS.lastName,
        dateOfBirth: vcData.EIDAS.eIDAS.dateOfBirth,
      },
      metadata: {
        source: "eIDAS eID",
        loa:  vcData.EIDAS.eIDAS.loa.charAt(0).toUpperCase() + vcData.EIDAS.eIDAS.loa.slice(1),
        "Credential-id": vcData.id,
      },
    },
  };
}


/*
{ TAXIS:
   { TAXIS:
      { fistName: 'ΕΥΤΥΧΙΑ',
        afm: '068933130   ',
        lastName: 'ΒΑΒΟΥΛΑ',
        fathersName: 'ΕΜΜΑΝΟΥΗΛ',
        mothersName: 'ΑΝΝΑ',
        dateOfBirth: '1950',
        loa: 'low',
        source: 'TAXIS' } },
  id: '19DRPJ' }


  
{ EBILL:
   { ebill:
      { ownership: 'owned',
        supplyType: 'power',
        endorser: 'triantafyllou.ni@gmail.com',
        meterNumber: '12312',
        source: 'ebill',
        loa: 'low',
        endorsement: 'pKORbUhKRrm0n7yhWD3f8A',
        id: '1CEZ2K' } } }
*/
function formatEbillClaim(vcData) {
  return {
    Electricity_Bill_ID: {
      claims: {
        name: vcData.EBILL.ebill.name,
        surname: vcData.EBILL.ebill.surname,
        father_name: vcData.EBILL.ebill.fathersName,
        afm: vcData.EBILL.ebill.fathersName,
        address: vcData.EBILL.ebill.address
          ? {
            street: vcData.EBILL.ebill.address.street,
            number: vcData.EBILL.ebill.address.number,
            municipality: vcData.EBILL.ebill.address.municipality,
            po: vcData.EBILL.ebill.address.po,
          }
          : {},
        meter_number: vcData.EBILL.ebill.meterNumber,
        ownership: vcData.EBILL.ebill.ownership,
        supply_type: vcData.EBILL.ebill.supplyType,
      },
      metadata: {
        source: "endorsed",
        endorser: vcData.EBILL.ebill.endorser,
        verification: vcData.EBILL.ebill.endorsement,
        id: vcData.EBILL.ebill.id,
      },
    },
  };
}

// { Contact:
//   { contact:
//      { ownership: 'owned',
//        supplyType: 'power',
//        endorser: 'triantafyllou.ni@gmail.com',
//        meterNumber: '12312',
//        source: 'ebill',
//        loa: 'low',
//        endorsement: 'pKORbUhKRrm0n7yhWD3f8A',
//        id: '1CEZ2K' } } }
function formatContactClaim(vcData) {
  return {
    CONTACT_ME: {
      claims: {
        name: vcData.Contact.contact.name,
        surname: vcData.Contact.contact.surname,
        email: vcData.Contact.contact.email,
        landline: vcData.Contact.contact.landline,
        landline: vcData.Contact.contact.landline,
        mobile: vcData.Contact.contact.mobile,
        iban: vcData.Contact.contact.iban,
      },
      metadata: {
        source: "endorsed",
        endorser: vcData.Contact.contact.endorser,
        verification: vcData.Contact.contact.endorsement,
        id: vcData.Contact.contact.id,
      },
    },
  };
}

/*
{ E1:
   { E1:
      { _id: '5f69ea1950159945fe59917a',
        salaries: '100',
        pensionIncome: '200',
        farmingActivity: '0',
        freelanceActivity: '0',
        rentIncome: '0',
        unemploymentBenefit: '0',
        otherBenefitsIncome: '0',
        ekas: '0',
        additionalIncomes: '1000',
        ergome: '0',
        depositInterest: '5000',
        deposits: '5000',
        valueOfRealEstate: '123',
        valueOfRealEstateInOtherCountries: '123123',
        valueOfOwnedVehicles: '0',
        investments: '123123123',
        householdComposition:
         '[{"name":"k","relation":"wife"},{"name":"a","relation":"daughter"}]',
        name: 'Nikos',
        surname: 'T',
        dateOfBirth: '05/10/83',
        municipality: 'Zografou',
        number: '50',
        po: '15771',
        prefecture: 'Attiki',
        street: 'Kallistratoys',
        source: 'E1',
        afm: afm
        loa: 'low' } },
  id: 'ZNLMI' }
*/

function formatFinancialIDClaim(vcData) {
  // console.log(vcData);

  return {
    PERSONAL_FINANCIAL_STATUS: {
      claims: {
        name: vcData.E1.E1.name,
        surname: vcData.E1.E1.surname,
        afm: vcData.E1.E1.afm,
        household_members: vcData.E1.E1.household_members,
        household_composition: vcData.E1.E1.householdComposition,
        salary_revenues: vcData.E1.E1.salaries,
        pension_revenues: vcData.E1.E1.pensionIncome,
        farming_activity: vcData.E1.E1.farmingActivity,
        freelance_activity: vcData.E1.E1.freelanceActivity,
        rent_income: vcData.E1.E1.rentIncome,
        ergosimo: vcData.E1.E1.ergom,
        unemploymenet_benefit: vcData.E1.E1.unemploymentBenefit,
        ekas: vcData.E1.E1.ekas,
        other_benefits_income: vcData.E1.E1.otherBenefitsIncome,
        additional_incomes: vcData.E1.E1.additionalIncomes,
        interests_property: vcData.E1.E1.depositInterest,
        deposits: vcData.E1.E1.deposits,
        real_estate_value_domestic: vcData.E1.E1.valueOfRealEstate,
        real_estate_value_offshore: vcData.E1.E1.valueOfRealEstateInOtherCountries,
        value_of_owned_vehicles: vcData.E1.E1.valueOfOwnedVehicles,
        investments: vcData.E1.E1.investments,

      },
      metadata: {
        source: "AADE & KE.D",
        id: vcData.id,
      },
    },
  };
}

function formatPersonalDeclarationClaim(vcData) {
  /*
   SELF: {
    self: {
      employed: true,
      participateFead: true,
      oaedid: '12345',
      oaedDate: '123451234',
      feadProvider: 'fead provider',
      personal: 'none',
      hospitalized: 'false',
      hospitalizedSpecific: 'false',
      monk: 'false',
      luxury: 'false',
      none: 'false',
      employmentStatus: 'employed',
      source: 'self',
      loa: 'low'
    }
  },
  id: '7XZFG'
}
  */
  return {
    KEA_PERSONAL_DECLARATION: {
      claims: {
        luxury: vcData.SELF.self.luxury,
        hospitalized_specific: vcData.SELF.self.hospitalizedSpecific,
        hospitalized: vcData.SELF.self.hospitalized,
        monk: vcData.SELF.self.monk,
        OAED_id: vcData.SELF.self.oaedid,
        OAED_reg_date: vcData.SELF.self.oaedDate,
        FEAD_participate: vcData.SELF.self.participateFead,
        FEAD_provider: vcData.SELF.self.feadProvider,
        employed: vcData.SELF.self.employed,
        employment_status: vcData.SELF.self.employmentStatus,
      },
      metadata: {
        source: "self",
        id: vcData.id,
      }
    }
  }
}


function formatCivilIDClaim(vcData) {
  /*
  { MITRO:
    { MITRO:
       { gender: 'Άρρεν',
         nationality: 'Ελληνική',
         singleParent: 'false',
         maritalStatus: 'married',
         motherLatin: 'ANGELIKI',
         fatherLatin: 'ANASTASIOS',
         nameLatin: 'NIKOLAOS',
         surnameLatin: 'TRIANTAFYLLOU',
         birthdate: '05/10/1983',
         amka: '05108304675',
         parenthood: 'true',
         protectedMembers: '2',
         custody: 'true',
         loa: 'low',
         source: 'MITRO' } },
   id: 'G3KV8' }
  */
  console.log("formating CivilIDClaim")
  return {
    Civil_Registry_ID: {
      claims: {
        name: vcData.MITRO.MITRO.name,
        surname: vcData.MITRO.MITRO.surname,
        name_latin: vcData.MITRO.MITRO.nameLatin,
        surname_latin: vcData.MITRO.MITRO.surnameLatin,
        father_name: vcData.MITRO.MITRO.fatherName,
        mother_name: vcData.MITRO.MITRO.motherName,
        father_name_latin: vcData.MITRO.MITRO.fatherLatin,
        mother_name_latin: vcData.MITRO.MITRO.motherLatin,
        birth_date: vcData.MITRO.MITRO.birthdate,
        amka: vcData.MITRO.MITRO.amka,
        nationality: vcData.MITRO.MITRO.nationality,
        gender: vcData.MITRO.MITRO.gender,
        marital_status: vcData.MITRO.MITRO.maritalStatus,
        parenthood: vcData.MITRO.MITRO.parenthood,
        custody: vcData.MITRO.MITRO.custody === 'true' ? "yes" : "no",
        single_parent: vcData.MITRO.MITRO.singleParent === 'true' ? "yes" : "no",
        number_of_chidren: vcData.MITRO.MITRO.protectedMembers,
        children_identity: vcData.MITRO.MITRO.children,

      },
      metadata: {
        source: "Mitro Politon, AMKA Check",
        id: vcData.id,
      },
    },
  };
}


export { formatCredentialData };
