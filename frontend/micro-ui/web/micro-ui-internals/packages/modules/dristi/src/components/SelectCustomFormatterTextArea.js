import { CardLabelError } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { isEmptyObject } from "../Utils";
import isEqual from "lodash/isEqual";
import "react-quill/dist/quill.snow.css";
import DOMPurify from "dompurify";
import ReactQuill from "react-quill";

const SelectCustomFormatterTextArea = ({ t, config, formData = {}, onSelect, errors }) => {
  const inputs = useMemo(
    () =>
      config?.populators?.inputs || [
        {
          textAreaHeader: "custom note",
          textAreaSubHeader: "please provide some more details.",
          isOptional: false,
          name: "comment",
        },
      ],
    [config?.populators?.inputs]
  );

  const defaultSanitizeOptions = {
    ALLOWED_TAGS: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "p",
      "a",
      "ul",
      "ol",
      "nl",
      "li",
      "b",
      "i",
      "strong",
      "em",
      "strike",
      "code",
      "hr",
      "br",
      "div",
      "table",
      "thead",
      "caption",
      "tbody",
      "tr",
      "th",
      "td",
      "pre",
      "span",
      "img",
    ],
  
    ALLOWED_ATTR: {
      "*": ["style", "class", "href", "src", "alt", "title", "width", "height", "name", "target"],
    },
  
    ALLOWED_STYLES: {
      "*": {
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
      },
    },
  
    KEEP_CONTENT: true,
    ALLOW_ARBITRARY_ATTRIBUTES: true,
  
    // ⭐ Added "class" here as requested
    ADD_ATTR: ["style", "class"],
  };
  

  const inputName = inputs?.[0]?.name;
  const configKey = config?.key;

  const debounceTimerRef = useRef(null);

  const initialHtml = useMemo(() => {
    const rawHtml = formData?.[configKey]?.[inputName] || "";
    const sanitized = DOMPurify.sanitize(rawHtml, defaultSanitizeOptions);
    return sanitized || "";
  }, [formData, configKey, inputName]);

  const [editorHtml, setEditorHtml] = useState(initialHtml);
  const [formdata, setFormData] = useState(formData);

  useEffect(() => {
    if (!isEqual(formdata, formData)) {
      setFormData(formData);
      setEditorHtml(initialHtml);
    }
  }, [formData]);

  function setValue(value, input) {
    let updatedValue = { ...formData[config.key] };

    updatedValue[input] = value;

    if (!value || value === "<p><br></p>" || value === "<p></p>") {
      updatedValue = null;
    }

    setFormData((prev) => ({
      ...prev,
      [config.key]: {
        ...prev[config.key],
        [input]: value,
      },
    }));

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onSelect(config.key, isEmptyObject(updatedValue) ? null : updatedValue, { shouldValidate: true });
    }, 150);
  }

  const handleChange = (value, input) => {
    const sanitized = DOMPurify.sanitize(value, defaultSanitizeOptions);
    setEditorHtml(sanitized);
    setValue(sanitized, input.name);
  };

  const quillModules = {
    toolbar: {
      container: [["bold", "italic"], [{ list: "ordered" }, { list: "bullet" }], [{ align: [] }]],
    },
  };

  const quillFormats = ["bold", "italic", "list", "bullet", "align", "indent"];

  return (
    <React.Fragment>
      {inputs.map((input) => (
        <div className="custom-text-area-main-div" style={input?.style} key={input.name}>
          <div className="custom-text-area-header-div">
            {input?.textAreaHeader && (
              <h1 className={`custom-text-area-header ${input?.headerClassName}`} style={{ margin: "0px 0px 8px", ...input.textAreaStyle }}>
                {t(input?.textAreaHeader)}
              </h1>
            )}
            {!config?.disableScrutinyHeader && (
              <span>
                <p className={`custom-sub-header ${input?.subHeaderClassName}`} style={{ margin: "0px 0px 8px" }}>
                {`${t(input?.textAreaSubHeader)}`}
                {input?.isOptional && <span style={{ color: "#77787B" }}>&nbsp;{t("CS_IS_OPTIONAL")}</span>}
              </p>
              </span>
            )}
          </div>

          <div className="custom-quill-wrapper">
            <ReactQuill
              theme="snow"
              value={editorHtml}
              onChange={(value) => handleChange(value, input)}
              modules={quillModules}
              formats={quillFormats}
              readOnly={config?.disable}
            />
          </div>
          {errors?.[configKey] && (
            <CardLabelError style={input?.errorStyle}>{t(errors[configKey].msg || "CORE_REQUIRED_FIELD_ERROR")}</CardLabelError>
          )}
        </div>
      ))}
    </React.Fragment>
  );
};

export default SelectCustomFormatterTextArea;
