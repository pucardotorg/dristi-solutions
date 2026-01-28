import React, { useState, useMemo } from "react";
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

const FormComposerPlayground = () => {
  const { t } = useTranslation();
  
  // Step 15: State for conditional field visibility
  const [showOtherGender, setShowOtherGender] = useState(false);
  
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

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f0f8ff", borderRadius: "8px" }}>
        <h3>FormComposerV2 Learning Playground</h3>
        <p><strong>Current Step:</strong> Step 15 - Conditional Fields</p>
        <p><strong>What you should see:</strong> Select "Other" in Gender to reveal a "Please Specify Gender" text field</p>
        <p><strong>Config mapping:</strong> useMemo + state + customStyle: display: none for conditional visibility</p>
      </div>

      <FormComposerV2
        config={configWithConditional}
        onSubmit={onSubmit}
        onFormValueChange={onFormValueChange}
        defaultValues={defaultFormValues}
        label="Submit Form"
        cardStyle={{ minWidth: "100%" }}
      />
    </div>
  );
};

export default FormComposerPlayground;
