import { CardLabelError } from "@egovernments/digit-ui-react-components";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { isEmptyObject } from "../Utils";
import isEqual from "lodash/isEqual";
import { Editor } from "react-draft-wysiwyg";
import { EditorState, convertToRaw, ContentState } from "draft-js";
import draftToHtml from "draftjs-to-html";
import htmlToDraft from "html-to-draftjs";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import DOMPurify from "dompurify";

const areHtmlContentsEqual = (a = "", b = "") => {
  const normalize = (str) =>
    str
      .replace(/\s+/g, "")
      .replace(/<p><br><\/p>/g, "<p></p>")
      .replace(/&nbsp;/g, "");

  return normalize(a) === normalize(b);
};

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
      a: ["href", "name", "target"],
      img: ["src", "alt", "title", "width", "height"],
      p: ["class", "style"],
      div: ["class", "style"],
      span: ["class", "style"],
    },
  };

  const inputName = inputs?.[0]?.name;
  const configKey = config?.key;

  const isLocalEditRef = useRef(false);
  const debounceTimerRef = useRef(null);

  const initialEditorState = useMemo(() => {
    try {
      const rawHtml = formData?.[configKey]?.[inputName] || "";
      const sanitizedIncomingHtml = DOMPurify.sanitize(rawHtml, defaultSanitizeOptions);

      const isHtml = /<\/?[a-z][\s\S]*>/i.test(sanitizedIncomingHtml);
      const safeHtml = isHtml ? sanitizedIncomingHtml : sanitizedIncomingHtml ? `<p>${sanitizedIncomingHtml}</p>` : "<p></p>";

      const contentBlock = htmlToDraft(safeHtml);

      if (contentBlock && Array.isArray(contentBlock.contentBlocks)) {
        const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
        return EditorState.createWithContent(contentState);
      } else {
        return EditorState.createEmpty();
      }
    } catch (err) {
      console.error("Error creating initial Draft.js state:", err);
      return EditorState.createEmpty();
    }
  }, [configKey, formData, inputName]);

  const [editorState, setEditorState] = useState(initialEditorState);
  const [formdata, setFormData] = useState(formData);

  useEffect(() => {
    if (!isEqual(formdata, formData)) {
      setFormData(formData);
    }
  }, [formData]);

  function setValue(value, input) {
    let updatedValue = {
      ...formData[config.key],
    };

    if (Array.isArray(input)) {
      updatedValue = {
        ...updatedValue,
        ...input.reduce((res, curr) => {
          res[curr] = value[curr];
          return res;
        }, {}),
      };
    } else {
      updatedValue[input] = value;
    }

    if (!value || value === "<p></p>" || value === "<p><br></p>") {
      updatedValue = null;
    }

    setFormData((prevData) => ({
      ...prevData,
      [config.key]: {
        ...prevData[config.key],
        [input]: value,
      },
    }));

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onSelect(config.key, isEmptyObject(updatedValue) ? null : updatedValue, { shouldValidate: true });
    }, 150);
  }

  const handleChange = (state, input) => {
    isLocalEditRef.current = true;
    setEditorState(state);
    const rawContent = convertToRaw(state.getCurrentContent());
    const html = draftToHtml(rawContent);
    const sanitizedHtml = DOMPurify.sanitize(html, defaultSanitizeOptions);
    setValue(sanitizedHtml, input?.name);
    setTimeout(() => {
      isLocalEditRef.current = false;
    }, 0);
  };

  const handleKeyCommand = (command, editorState) => {
    return "not-handled";
  };

  const handleReturn = (e, editorState) => {
    setTimeout(() => {
      const editorContainer = document.querySelector(".custom-editor-wrapper .DraftEditor-root");
      if (editorContainer) {
        editorContainer.scrollTop = editorContainer.scrollHeight;
      }
    }, 10);

    return "not-handled";
  };

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

          <div className="demo-section-wrapper">
            <div className="demo-editor-wrapper">
              <Editor
                key={`${configKey}-${inputName}`}
                editorState={editorState}
                onEditorStateChange={(state) => handleChange(state, input)}
                wrapperClassName="demo-wrapper"
                editorClassName="demo-editor"
                toolbar={{
                  options: ["inline", "list", "textAlign"],
                  inline: {
                    inDropdown: false,
                    options: ["bold", "italic"],
                  },
                  list: {
                    inDropdown: false,
                    className: undefined,
                    component: undefined,
                    dropdownClassName: undefined,
                    options: ["unordered", "ordered"],
                  },
                  textAlign: {
                    inDropdown: false,
                    className: undefined,
                    component: undefined,
                    dropdownClassName: undefined,
                    options: ["left", "center", "right", "justify"],
                  },
                }}
                toolbarHidden={config?.disable}
                readOnly={config?.disable}
              />
            </div>
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
