import React, { useState, useMemo, Fragment } from "react";
import { FormComposerV2, Header } from "@egovernments/digit-ui-react-components";
import { useTranslation } from "react-i18next";

/**
 * FormComposerV2 Learning Playground
 * 
 * This is a safe, isolated page for learning FormComposerV2.
 * It has NO dependencies on business flows and NO shared state mutations.
 * 
 * Route: /employee/form-composer-v2-playground
 */

// Tab configuration
const TABS = [
  { key: "basic", label: "Basic Playground" },
  { key: "witness", label: "Witness Form" }
];

const FormComposerPlayground = () => {
  const { t } = useTranslation();
  
  // Tab state
  const [activeTab, setActiveTab] = useState("basic");
  
  // Step 15: State for conditional field visibility (Basic tab)
  const [showOtherGender, setShowOtherGender] = useState(false);
  
  // ============ WITNESS FORM STATE ============
  // Track witness type for conditional sections
  const [witnessType, setWitnessType] = useState(null); // "INDIVIDUAL" or "ORGANIZATION"
  const isIndividual = witnessType === "INDIVIDUAL";
  const isOrganization = witnessType === "ORGANIZATION";
  
  // Step 15: Dynamic config with conditional field
  const configWithConditional = useMemo(() => [
    {
      body: [
        {
          type: "text",
          key: "fullName",
          label: "First Name",
          isMandatory: true,
          disable: true,
          populators: {
            name: "fullName",
          }
        },
        {
          type: "text",
          key: "emailId",
          label: "Email Address",
          isMandatory: false,
          populators: {
            name: "emailId",
            validation: {
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              patternType: "Email",
              errMsg: "Please enter a valid email address"
            }
          }
        },
        {
          type: "dropdown",
          key: "country",
          label: "Country",
          isMandatory: false,
          populators: {
            name: "country",
            options: [
              { code: "US", name: "United States" },
              { code: "UK", name: "United Kingdom" },
              { code: "IN", name: "India" },
              { code: "CA", name: "Canada" },
              { code: "AU", name: "Australia" }
            ],
            optionsKey: "name"
          }
        },
        {
          type: "radio",
          key: "gender",
          label: "Gender",
          isMandatory: true,
          populators: {
            name: "gender",
            type: "radioButton",
            optionsKey: "name",
            error: "CORE_REQUIRED_FIELD_ERROR",
            required: true,
            options: [
              { code: "MALE", name: "Male" },
              { code: "FEMALE", name: "Female" },
              { code: "OTHER", name: "Other" }
            ]
          }
        },
        // Step 15: Conditional field - only visible when gender is "Other"
        {
          type: "text",
          key: "otherGender",
          label: "Please Specify Gender",
          isMandatory: showOtherGender,  // Only mandatory when visible
          populators: {
            name: "otherGender",
            customStyle: showOtherGender ? {} : { display: "none" }  // Conditional visibility
          }
        },
        {
          type: "checkbox",
          key: "agreeToTerms",
          label: "",
          isMandatory: true,
          populators: {
            name: "agreeToTerms",
            title: "I agree to the Terms and Conditions",
            styles: { marginTop: "10px" },
            labelStyles: { fontSize: "14px" },
            checkboxWidth: { width: "10px", height: "10px" },
            isMandatory: true
          }
        },
        {
          type: "textarea",
          key: "comments",
          label: "Additional Comments",
          isMandatory: false,
          populators: {
            name: "comments",
            validation: {
              maxlength: 500
            }
          }
        },
        {
          type: "multiselectdropdown",
          key: "skills",
          label: "Select Skills",
          isMandatory: false,
          populators: {
            name: "skills",
            options: [
              { code: "JS", name: "JavaScript" },
              { code: "PY", name: "Python" },
              { code: "JAVA", name: "Java" },
              { code: "REACT", name: "React" },
              { code: "NODE", name: "Node.js" }
            ],
            optionsKey: "name",
            config: {
              isDropdownWithChip: true  // Shows selected values as removable tags
            }
          }
        }
      ]
    }
  ], [showOtherGender]);  // Re-compute config when showOtherGender changes

  // ============ WITNESS FORM CONFIG ============
  // This demonstrates production patterns: conditional sections, section headers, validation
  const witnessFormConfig = useMemo(() => [
    // Section 1: Witness Type Selection
    {
      head: "Select Witness Type",
      body: [
        {
          type: "radio",
          key: "witnessType",
          label: "Type of Witness",
          isMandatory: true,
          populators: {
            name: "witnessType",
            type: "radioButton",
            optionsKey: "name",
            error: "Please select witness type",
            required: true,
            options: [
              { code: "INDIVIDUAL", name: "Individual" },
              { code: "ORGANIZATION", name: "Organization" }
            ],
            customStyle: {
              display: "flex",
              flexDirection: "row",
              gap: "40px"
            }
          }
        }
      ]
    },
    // Section 2: Individual Details (shown when witnessType is INDIVIDUAL)
    {
      head: "Personal Details",
      body: [
        {
          type: "text",
          key: "firstName",
          label: "First Name",
          isMandatory: isIndividual,
          populators: {
            name: "firstName",
            error: "First name is required",
            validation: {
              pattern: /^[A-Za-z\s]+$/,
              patternType: "Name",
              errMsg: "Please enter a valid name (letters only)"
            },
            customStyle: isIndividual ? {} : { display: "none" }
          }
        },
        {
          type: "text",
          key: "middleName",
          label: "Middle Name",
          isMandatory: false,
          labelChildren: "(Optional)",
          populators: {
            name: "middleName",
            validation: {
              pattern: /^[A-Za-z\s]*$/,
              patternType: "Name"
            },
            customStyle: isIndividual ? {} : { display: "none" }
          }
        },
        {
          type: "text",
          key: "lastName",
          label: "Last Name",
          isMandatory: false,
          labelChildren: "(Optional)",
          populators: {
            name: "lastName",
            validation: {
              pattern: /^[A-Za-z\s]*$/,
              patternType: "Name"
            },
            customStyle: isIndividual ? {} : { display: "none" }
          }
        },
        {
          type: "text",
          key: "age",
          label: "Age",
          isMandatory: isIndividual,
          populators: {
            name: "age",
            error: "Please enter valid age",
            validation: {
              pattern: /^[0-9]{1,3}$/,
              patternType: "Number",
              errMsg: "Age must be a number between 1-150"
            },
            customStyle: isIndividual ? {} : { display: "none" }
          }
        }
      ].filter(field => isIndividual || field.populators?.customStyle?.display !== "none" ? true : false)
    },
    // Section 3: Organization Details (shown when witnessType is ORGANIZATION)
    {
      head: "Organization Details",
      body: [
        {
          type: "text",
          key: "companyName",
          label: "Company/Organization Name",
          isMandatory: isOrganization,
          populators: {
            name: "companyName",
            error: "Company name is required",
            validation: {
              minLength: 2,
              errMsg: "Please enter a valid company name"
            },
            customStyle: isOrganization ? {} : { display: "none" }
          }
        },
        {
          type: "text",
          key: "designation",
          label: "Designation",
          isMandatory: false,
          labelChildren: "(Optional)",
          populators: {
            name: "designation",
            customStyle: isOrganization ? {} : { display: "none" }
          }
        },
        {
          type: "text",
          key: "representativeName",
          label: "Representative Name",
          isMandatory: isOrganization,
          populators: {
            name: "representativeName",
            error: "Representative name is required",
            validation: {
              pattern: /^[A-Za-z\s]+$/,
              patternType: "Name"
            },
            customStyle: isOrganization ? {} : { display: "none" }
          }
        }
      ].filter(field => isOrganization || field.populators?.customStyle?.display !== "none" ? true : false)
    },
    // Section 4: Contact Information (always visible once type is selected)
    {
      head: "Contact Information",
      body: [
        {
          type: "text",
          key: "phoneNumber",
          label: "Phone Number",
          isMandatory: false,
          labelChildren: "(Optional)",
          populators: {
            name: "phoneNumber",
            validation: {
              pattern: /^[0-9]{10}$/,
              patternType: "Phone",
              errMsg: "Please enter a valid 10-digit phone number"
            },
            customStyle: witnessType ? {} : { display: "none" }
          }
        },
        {
          type: "text",
          key: "email",
          label: "Email Address",
          isMandatory: false,
          labelChildren: "(Optional)",
          populators: {
            name: "email",
            validation: {
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              patternType: "Email",
              errMsg: "Please enter a valid email address"
            },
            customStyle: witnessType ? {} : { display: "none" }
          }
        },
        {
          type: "textarea",
          key: "additionalDetails",
          label: "Additional Details",
          isMandatory: false,
          labelChildren: "(Optional)",
          populators: {
            name: "additionalDetails",
            validation: {
              maxlength: 500
            },
            customStyle: witnessType ? {} : { display: "none" }
          }
        }
      ].filter(field => witnessType || field.populators?.customStyle?.display !== "none" ? true : false)
    }
  ], [witnessType, isIndividual, isOrganization]);

  // Witness form default values
  const witnessDefaultValues = {};

  // Witness form value change handler
  const onWitnessFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    console.log("Witness form value changed:", formData);
    
    // Track witness type changes
    const newWitnessType = formData?.witnessType?.code;
    if (newWitnessType !== witnessType) {
      setWitnessType(newWitnessType);
      
      // Clear fields from the other type when switching
      if (newWitnessType === "INDIVIDUAL") {
        setValue("companyName", "");
        setValue("designation", "");
        setValue("representativeName", "");
      } else if (newWitnessType === "ORGANIZATION") {
        setValue("firstName", "");
        setValue("middleName", "");
        setValue("lastName", "");
        setValue("age", "");
      }
    }
  };

  const onWitnessSubmit = (data) => {
    console.log("Witness form submitted:", data);
    alert(`Witness form submitted!\n\nType: ${data.witnessType?.name}\nCheck console for full data.`);
  };

  // Default values for the form
  const defaultFormValues = {
    fullName: "John Doe",
    emailId: "john.doe@example.com",
    country: {
      code: "IN",
      name: "India"
    },
    birthDate: new Date().toISOString().split('T')[0],
    gender: {
      code: "MALE",
      name: "Male"
    },
    agreeToTerms: true,
    comments: "This is a sample comment...",
    skills: [{ code: "JS", name: "JavaScript" }, { code: "REACT", name: "React" }]  // Multi-select default is array
  };

  const onSubmit = (data) => {
    console.log("Form submitted:", data);
    alert("Form submitted! Check console for data.");
  };

  const onFormValueChange = (setValue, formData, formState, reset, setError, clearErrors, trigger, getValues) => {
    console.log("Form value changed:", formData);
    
    // Step 15: Toggle conditional field based on gender selection
    const isOtherGender = formData?.gender?.code === "OTHER";
    if (isOtherGender !== showOtherGender) {
      setShowOtherGender(isOtherGender);
      // Clear otherGender value when hiding the field
      if (!isOtherGender && formData?.otherGender) {
        setValue("otherGender", "");
      }
    }
  };

  // Tab styles
  const tabContainerStyle = {
    display: "flex",
    borderBottom: "2px solid #e0e0e0",
    marginBottom: "20px"
  };
  
  const getTabStyle = (tabKey) => ({
    padding: "12px 24px",
    cursor: "pointer",
    borderBottom: activeTab === tabKey ? "3px solid #f47738" : "none",
    color: activeTab === tabKey ? "#f47738" : "#505a5f",
    fontWeight: activeTab === tabKey ? "600" : "400",
    backgroundColor: "transparent",
    border: "none",
    fontSize: "16px"
  });

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px" }}>FormComposerV2 Learning Playground</h2>
      
      {/* Tab Navigation */}
      <div style={tabContainerStyle}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            style={getTabStyle(tab.key)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Playground Tab */}
      {activeTab === "basic" && (
        <Fragment>
          <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f0f8ff", borderRadius: "8px" }}>
            <h3>Basic Playground</h3>
            <p><strong>Features:</strong> Text, Email, Dropdown, Radio, Checkbox, Textarea, Multi-select, Conditional fields</p>
            <p><strong>Try:</strong> Select "Other" in Gender to reveal conditional field</p>
          </div>

          <FormComposerV2
            config={configWithConditional}
            onSubmit={onSubmit}
            onFormValueChange={onFormValueChange}
            defaultValues={defaultFormValues}
            label="Submit Form"
            cardStyle={{ minWidth: "100%" }}
          />
        </Fragment>
      )}

      {/* Witness Form Tab */}
      {activeTab === "witness" && (
        <Fragment>
          <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#fff8e1", borderRadius: "8px" }}>
            <h3>Witness Form (Production Pattern)</h3>
            <p><strong>Features:</strong> Section headers, Conditional sections, Form validation, Field clearing on type switch</p>
            <p><strong>Try:</strong> Select "Individual" or "Organization" to see different fields appear</p>
            <p><strong>Pattern:</strong> State-based conditional visibility with useMemo config regeneration</p>
          </div>

          <FormComposerV2
            config={witnessFormConfig}
            onSubmit={onWitnessSubmit}
            onFormValueChange={onWitnessFormValueChange}
            defaultValues={witnessDefaultValues}
            label="Add Witness"
            cardStyle={{ minWidth: "100%" }}
          />
        </Fragment>
      )}
    </div>
  );
};

export default FormComposerPlayground;
