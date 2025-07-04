import React, { useEffect, useReducer, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, CheckSvg } from "../icons/svgIndex";
import RemoveableTag from "./RemoveableTag";
import { COLOR_FILL } from "../contants";

const MultiSelectDropdown = ({
  options,
  optionsKey,
  selected = [],
  onSelect,
  defaultLabel = "",
  defaultUnit = "",
  BlockNumber = 1,
  isOBPSMultiple = false,
  props = {},
  isPropsNeeded = false,
  ServerStyle = {},
  isSurvey = false,
  placeholder,
  disable = false,
  config,
  customLabel = "",
  parentRef,
  isOpenAbove = false,
}) => {
  const [active, setActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState();
  const [optionIndex, setOptionIndex] = useState(-1);
  const [openAbove, setOpenAbove] = useState(false);
  const dropdownRef = useRef();
  const { t } = useTranslation();

  function reducer(state, action) {
    switch (action.type) {
      case "ADD_TO_SELECTED_EVENT_QUEUE":
        return [...state, { [optionsKey]: action.payload?.[1]?.[optionsKey], propsData: action.payload }];
      case "REMOVE_FROM_SELECTED_EVENT_QUEUE":
        const newState = state.filter((e) => e?.[optionsKey] !== action.payload?.[1]?.[optionsKey]);
        onSelect(
          newState.map((e) => e.propsData),
          props
        );
        return newState;
      case "ADD_ALL":
        const newStateWithAll = [
          ...action?.payload?.filter((data) => !data?.isDisabled)?.map((data) => ({ [optionsKey]: data?.[optionsKey], propsData: [null, data] })),
        ];
        onSelect(
          newStateWithAll.map((e) => e.propsData),
          props
        );
        return newStateWithAll;
      case "REMOVE_ALL":
        onSelect([], props);
        return [];
      case "REPLACE_COMPLETE_STATE":
        return action.payload;
      default:
        return state;
    }
  }

  useEffect(() => {
    dispatch({ type: "REPLACE_COMPLETE_STATE", payload: fnToSelectOptionThroughProvidedSelection(selected) });
  }, [selected?.length, selected?.[0]?.code]);

  function fnToSelectOptionThroughProvidedSelection(selected) {
    return selected?.map((e) => ({ [optionsKey]: e?.[optionsKey], propsData: [null, e] }));
  }

  const [alreadyQueuedSelectedState, dispatch] = useReducer(reducer, selected, fnToSelectOptionThroughProvidedSelection);

  useEffect(() => {
    if (!active) {
      onSelect(
        alreadyQueuedSelectedState?.map((e) => e.propsData),
        props
      );
    }
  }, [active]);

  function handleOutsideClickAndSubmitSimultaneously() {
    setActive(false);
  }

  Digit.Hooks.useClickOutside(dropdownRef, handleOutsideClickAndSubmitSimultaneously, active, { capture: true });
  const filtOptns =
    searchQuery?.length > 0
      ? options.filter(
          (option) =>
            t(option[optionsKey] && typeof option[optionsKey] == "string" && option[optionsKey].toUpperCase())
              .toLowerCase()
              .indexOf(searchQuery.toLowerCase()) >= 0
        )
      : options;

  function onSearch(e) {
    setSearchQuery(e.target.value);
  }

  const onSelectAll = (e, payload) => {
    const isChecked = e.target.checked;
    isChecked ? dispatch({ type: "ADD_ALL", payload }) : dispatch({ type: "REMOVE_ALL" });
  };

  function onSelectToAddToQueue(...props) {
    const isChecked = arguments[0].target.checked;
    isChecked
      ? dispatch({ type: "ADD_TO_SELECTED_EVENT_QUEUE", payload: arguments })
      : dispatch({ type: "REMOVE_FROM_SELECTED_EVENT_QUEUE", payload: arguments });
  }

  /* Custom function to scroll and select in the dropdowns while using key up and down */
  const keyChange = (e) => {
    if (e.key == "ArrowDown") {
      setOptionIndex((state) => (state + 1 == filtOptns.length ? 0 : state + 1));
      if (optionIndex + 1 == filtOptns.length) {
        e?.target?.parentElement?.parentElement?.children?.namedItem("jk-dropdown-unique")?.scrollTo?.(0, 0);
      } else {
        optionIndex > 2 && e?.target?.parentElement?.parentElement?.children?.namedItem("jk-dropdown-unique")?.scrollBy?.(0, 45);
      }
      e.preventDefault();
    } else if (e.key == "ArrowUp") {
      setOptionIndex((state) => (state !== 0 ? state - 1 : filtOptns.length - 1));
      if (optionIndex === 0) {
        e?.target?.parentElement?.parentElement?.children?.namedItem("jk-dropdown-unique")?.scrollTo?.(100000, 100000);
      } else {
        optionIndex > 2 && e?.target?.parentElement?.parentElement?.children?.namedItem("jk-dropdown-unique")?.scrollBy?.(0, -45);
      }
      e.preventDefault();
    } else if (e.key == "Enter") {
      onSelectToAddToQueue(e, filtOptns[optionIndex]);
    }
  };

  const SelectAllMenuItem = ({ filteredOptions }) => {
    const isDisabled = filteredOptions?.every((option) => option?.isDisabled);
    return (
      <div key={filteredOptions?.length + 1} className={`${isDisabled ? "disabled" : ""}`} style={{ ...(isDisabled && { background: "#D2D2D2" }) }}>
        <input
          type="checkbox"
          checked={
            alreadyQueuedSelectedState?.length > 0 &&
            filteredOptions?.filter((option) => !option?.isDisabled)?.length > 0 &&
            filteredOptions
              ?.filter((option) => !option?.isDisabled)
              ?.every((option) => alreadyQueuedSelectedState.some((selected) => selected[optionsKey] === option[optionsKey]))
          }
          onChange={(e) => {
            onSelectAll(e, filteredOptions);
          }}
          style={{ minWidth: "24px", width: "100%" }}
          disabled={isDisabled || false}
        />
        <div className="custom-checkbox">
          <CheckSvg
            style={{ innerWidth: "24px", width: "100%", ...(isDisabled && { opacity: 1 }) }}
            fill={isDisabled ? "#505050" : COLOR_FILL}
            checkBoxFill={isDisabled ? "#D2D2D2" : undefined}
            tickStyle={isDisabled ? { opacity: 0 } : {}}
          />
        </div>
        <p className="label">{t("SELECT_ALL")}</p>
      </div>
    );
  };

  const MenuItem = ({ option, index }) => (
    <div
      key={index}
      className={`${option?.isDisabled ? "disabled" : ""}`}
      style={
        isOBPSMultiple
          ? index % 2 !== 0
            ? { background: "#EEEEEE", ...(option?.isDisabled && { background: "#D2D2D2" }) }
            : { ...(option?.isDisabled && { background: "#D2D2D2" }) }
          : { ...(option?.isDisabled && { background: "#D2D2D2" }) }
      }
    >
      <input
        type="checkbox"
        value={option[optionsKey]}
        checked={alreadyQueuedSelectedState.find((selectedOption) => selectedOption[optionsKey] === option[optionsKey]) ? true : false}
        onChange={(e) =>
          isPropsNeeded
            ? onSelectToAddToQueue(e, option, props)
            : isOBPSMultiple
            ? onSelectToAddToQueue(e, option, BlockNumber)
            : onSelectToAddToQueue(e, option)
        }
        style={{ minWidth: "24px", width: "100%" }}
        disabled={option?.isDisabled || false}
      />
      <div className="custom-checkbox">
        <CheckSvg
          style={{ innerWidth: "24px", width: "100%", ...(option?.isDisabled && { opacity: 1 }) }}
          fill={option?.isDisabled ? "#505050" : COLOR_FILL}
          checkBoxFill={option?.isDisabled ? "#D2D2D2" : undefined}
          tickStyle={option?.isDisabled ? { opacity: 0 } : {}}
        />
      </div>
      <p
        className="label"
        style={
          index === optionIndex
            ? {
                opacity: 1,
                backgroundColor: "rgba(238, 238, 238, var(--bg-opacity))",
              }
            : {}
        }
      >
        {t(option[optionsKey] && typeof option[optionsKey] == "string" && option[optionsKey])}
      </p>
    </div>
  );

  const Menu = () => {
    const filteredOptions =
      searchQuery?.length > 0
        ? options.filter(
            (option) =>
              t(option[optionsKey] && typeof option[optionsKey] == "string" && option[optionsKey].toUpperCase())
                .toLowerCase()
                .indexOf(searchQuery.toLowerCase()) >= 0
          )
        : options;
    return [
      ...(config?.isSelectAll ? [<SelectAllMenuItem filteredOptions={filteredOptions} />] : []),
      filteredOptions?.map((option, index) => <MenuItem option={option} key={index} index={index} />),
    ];
  };

  useEffect(() => {
    if (active && dropdownRef.current && parentRef?.current) {
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      const parentRect = parentRef.current.getBoundingClientRect();

      const spaceBelow = parentRect.bottom - dropdownRect.bottom;
      const spaceAbove = dropdownRect.top - parentRect.top;
      setOpenAbove(isOpenAbove || (spaceBelow < 200 && spaceAbove > spaceBelow));
    }
  }, [active, parentRef, isOpenAbove]);

  return (
    <div style={{ marginBottom: "1px" }}>
      <div className={`multi-select-dropdown-wrap ${disable ? "disabled" : ""}`} ref={dropdownRef}>
        <div className={`master${active ? `-active` : ``} ${disable ? "disabled" : ""}`}>
          <input
            className="cursorPointer"
            type="text"
            onKeyDown={keyChange}
            onFocus={() => setActive(true)}
            value={searchQuery}
            onChange={onSearch}
            placeholder={t(placeholder)}
          />
          <div className="label">
            <p>
              {customLabel
                ? customLabel
                : alreadyQueuedSelectedState.length > 0
                ? `${
                    isSurvey ? alreadyQueuedSelectedState?.filter((ob) => ob?.i18nKey !== undefined).length : alreadyQueuedSelectedState.length
                  } ${defaultUnit}`
                : defaultLabel}
            </p>
            <ArrowDown disable={disable} />
          </div>
        </div>
        {active ? (
          <div
            className="server"
            id="jk-dropdown-unique"
            style={{
              ...(ServerStyle || {}),
              position: "absolute",
              top: openAbove ? "auto" : "100%",
              bottom: openAbove ? "100%" : "auto",
              overflowX: "hidden",
            }}
          >
            <Menu />
          </div>
        ) : null}
      </div>
      {config?.isDropdownWithChip ? (
        <div className="tag-container">
          {alreadyQueuedSelectedState.length > 0 &&
            alreadyQueuedSelectedState.map((value, index) => {
              return (
                <RemoveableTag
                  key={index}
                  text={`${t(value[optionsKey]).slice(0, 22)} ...`}
                  onClick={isPropsNeeded ? (e) => onSelectToAddToQueue(e, value, props) : (e) => onSelectToAddToQueue(e, value)}
                />
              );
            })}
        </div>
      ) : null}
    </div>
  );
};

export default MultiSelectDropdown;
