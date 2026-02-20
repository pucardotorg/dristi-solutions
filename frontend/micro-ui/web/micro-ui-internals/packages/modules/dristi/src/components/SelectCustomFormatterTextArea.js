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
  // Track the last value we emitted upward to avoid clobbering local edits with stale prop updates
  const lastEmittedValueRef = useRef("");
  const ignorePropSyncRef = useRef(false);

  const initialHtml = useMemo(() => {
    const rawHtml = formData?.[configKey]?.[inputName] || "";
    const sanitized = DOMPurify.sanitize(rawHtml, defaultSanitizeOptions);
    return sanitized || "";
  }, [formData, configKey, inputName]);

  const [editorHtml, setEditorHtml] = useState(initialHtml);

  // Sync from props only when incoming value is meaningfully different from both
  // the current editor state and the last value we emitted upward. This prevents
  // race conditions where a stale parent update overwrites a user's recent clear.
  useEffect(() => {
    const nextFromProps = initialHtml;
    if (nextFromProps !== editorHtml) {
      setEditorHtml(nextFromProps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHtml]);

  const normalizeEmptyHtml = (v) => {
    if (v === null || v === undefined) return "";
    // Remove non-breaking spaces and zero-width spaces before checking emptiness
    const cleaned = String(v)
      .replace(/\u00A0/g, " ")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim();
    const trimmed = cleaned.replace(/\s+/g, "").toLowerCase();
    if (trimmed === "<p><br></p>" || trimmed === "<p></p>" || trimmed === "<br/>" || trimmed === "<br>" || trimmed === "") return "";
    return cleaned;
  };

  function setValue(value, input) {
    const normalized = normalizeEmptyHtml(value);
    let updatedValue = { ...(formData?.[config.key] || {}) };

    updatedValue[input] = normalized;

    // Remember the last value we emitted upwards to avoid rehydrating stale props
    lastEmittedValueRef.current = normalized;
    // Enter ignore window until parent reflects the same value
    ignorePropSyncRef.current = true;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    // If cleared, emit immediately to parent to avoid flashing old content back
    if (normalized === "") {
      onSelect(config.key, updatedValue, { shouldValidate: true });
    } else {
      debounceTimerRef.current = setTimeout(() => {
        onSelect(config.key, updatedValue, { shouldValidate: true });
      }, 100);
    }
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
