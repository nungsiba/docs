// ============================================================
// DOCSAVER — document type definitions
// Each type lists the fields used both for the "type it in"
// form and for laying out the generated PDF.
// field.kind: "text" | "date" | "select" | "photo" | "signature"
// ============================================================

const DOC_TYPES = {
  aadhaar: {
    label: "Aadhaar Card",
    icon: "A",
    fields: [
      { key: "full_name", label: "Full Name", kind: "text" },
      { key: "dob_or_yob", label: "Date of Birth / Year of Birth", kind: "text" },
      { key: "gender", label: "Gender", kind: "select", options: ["Male", "Female", "Transgender"] },
      { key: "aadhaar_number", label: "12-digit Aadhaar Number", kind: "text" },
      { key: "vid", label: "16-digit Virtual ID (VID)", kind: "text" },
      { key: "photo", label: "Profile Photograph", kind: "photo" }
    ]
  },
  pan: {
    label: "PAN Card",
    icon: "P",
    fields: [
      { key: "full_name", label: "Full Name", kind: "text" },
      { key: "parent_name", label: "Father's / Mother's Name", kind: "text" },
      { key: "dob", label: "Date of Birth", kind: "date" },
      { key: "pan_number", label: "PAN Number (10-digit alphanumeric)", kind: "text" },
      { key: "photo", label: "Holder's Photo", kind: "photo" },
      { key: "signature", label: "Holder's Signature", kind: "signature" }
    ]
  },
  driving_license: {
    label: "Driving License",
    icon: "DL",
    fields: [
      { key: "full_name", label: "Full Name", kind: "text" },
      { key: "dl_number", label: "Driving License Number", kind: "text" },
      { key: "dob", label: "Date of Birth", kind: "date" },
      { key: "issue_date", label: "Issue Date", kind: "date" },
      { key: "expiry_date", label: "Expiry Date", kind: "date" },
      { key: "vehicle_classes", label: "Allowed Vehicle Classes (e.g. MCWG, LMV)", kind: "text" },
      { key: "rto_name", label: "State / RTO Name", kind: "text" },
      { key: "photo", label: "Holder's Photo", kind: "photo" },
      { key: "signature", label: "Holder's Signature", kind: "signature" }
    ]
  },
  atm_card: {
    label: "ATM / Debit Card",
    icon: "$",
    fields: [
      { key: "cardholder_name", label: "Cardholder Name", kind: "text" },
      { key: "last4", label: "Last 4 digits of card number", kind: "text", maxLength: 4,
        hint: "Only the last 4 digits are stored as text. Keep the full card visible in the uploaded photo, not typed here." },
      { key: "expiry", label: "Expiry (MM/YY)", kind: "text" },
      { key: "bank_name", label: "Bank Name", kind: "text" },
      { key: "network", label: "Card Network (Visa / Mastercard / RuPay)", kind: "text" }
    ]
  },
  passbook: {
    label: "Bank Passbook",
    icon: "B",
    fields: [
      { key: "account_holder", label: "Account Holder Name", kind: "text" },
      { key: "account_number", label: "Bank Account Number", kind: "text" },
      { key: "ifsc", label: "IFSC Code", kind: "text" },
      { key: "micr", label: "MICR Code", kind: "text" },
      { key: "branch", label: "Branch Name & Address", kind: "text" },
      { key: "cif", label: "Customer ID / CIF Number", kind: "text" },
      { key: "account_type", label: "Account Type", kind: "text" }
    ]
  },
  birth_certificate: {
    label: "Birth Certificate",
    icon: "BC",
    fields: [
      { key: "child_name", label: "Child's Full Name", kind: "text" },
      { key: "dob", label: "Date of Birth", kind: "date" },
      { key: "place_of_birth", label: "Place of Birth", kind: "text" },
      { key: "gender", label: "Gender", kind: "select", options: ["Male", "Female", "Transgender"] },
      { key: "father_name", label: "Father's Name", kind: "text" },
      { key: "mother_name", label: "Mother's Name", kind: "text" },
      { key: "registration_number", label: "Registration Number", kind: "text" },
      { key: "registration_date", label: "Registration Date", kind: "date" },
      { key: "issuing_authority", label: "Issuing Authority (Municipal Corp. / Gram Panchayat)", kind: "text" }
    ]
  },
  passport: {
    label: "Passport",
    icon: "PP",
    fields: [
      { key: "full_name", label: "Full Name (Given + Surname)", kind: "text" },
      { key: "passport_number", label: "Passport Number", kind: "text" },
      { key: "dob", label: "Date of Birth", kind: "date" },
      { key: "place_of_birth", label: "Place of Birth", kind: "text" },
      { key: "gender", label: "Gender", kind: "text" },
      { key: "nationality", label: "Nationality", kind: "text" },
      { key: "issue_date", label: "Date of Issue", kind: "date" },
      { key: "expiry_date", label: "Date of Expiry", kind: "date" },
      { key: "issuing_authority", label: "Issuing Authority / Office", kind: "text" },
      { key: "photo", label: "Holder's Photo", kind: "photo" },
      { key: "signature", label: "Holder's Signature", kind: "signature" }
    ]
  }
};

const DOC_TYPE_ORDER = [
  "aadhaar", "pan", "driving_license", "atm_card",
  "passbook", "birth_certificate", "passport"
];
