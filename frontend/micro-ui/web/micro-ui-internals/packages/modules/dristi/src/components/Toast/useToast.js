import PropTypes from "prop-types";
import React, { useCallback, useContext, useState } from "react";

const ToastContext = React.createContext({
  message: "",
  setMessage: () => {},
  type: "",
  setType: () => {},
});

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);
  const [type, setType] = useState(null);

  return <ToastContext.Provider value={{ message, setMessage, type, setType }}>{children}</ToastContext.Provider>;
}

ToastProvider.propTypes = {
  children: PropTypes.node,
};

export function useToast() {
  const { message, setMessage, type, setType } = useContext(ToastContext);

  const toast = useCallback((nextMessage, timeout, nextType) => {
    setMessage(nextMessage);
    setType(nextType);
    setTimeout(() => {
      setMessage(null);
      setType(null);
    }, timeout);
  }, [setMessage, setType]);

  const success = useCallback(
    (nextMessage, timeout = 3000) => {
      toast(nextMessage, timeout, "success");
    },
    [toast]
  );

  const error = useCallback(
    (nextMessage, timeout = 3000) => {
      toast(nextMessage, timeout, "error");
    },
    [toast]
  );

  const info = useCallback(
    (nextMessage, timeout = 3000) => {
      toast(nextMessage, timeout, "info");
    },
    [toast]
  );

  const done = useCallback(() => {
    setMessage(null);
    setType(null);
  }, [setMessage, setType]);

  return {
    toastMessage: message,
    toastType: type,
    success,
    error,
    info,
    closeToast: done,
  };
}
