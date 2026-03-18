import React, { useCallback, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const ToastContext = React.createContext({
  message: "",
  setMessage: () => { },
  type: "",
  setType: () => { },
});

export function ToastProvider({ children }) {
  const [message, setMessage] = useState(null);
  const [type, setType] = useState(null);
  const history = useHistory();
  useEffect(() => {
    const toastInfo = history?.location?.state?.toast;
    const done = () => {
      setMessage(null);
      setType(null);
    };
    if (toastInfo) {
      const { message, type, timeout } = toastInfo;
      setMessage(message);
      setType(type);
      setTimeout(() => done(), timeout);
    }
  }, [history?.location?.state?.toast]);
  return <ToastContext.Provider value={{ message, setMessage, type, setType }}>{children}</ToastContext.Provider>;
}

