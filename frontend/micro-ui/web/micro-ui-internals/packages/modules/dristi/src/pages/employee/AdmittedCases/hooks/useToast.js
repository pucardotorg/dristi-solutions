import { useState, useCallback } from "react";

/**
 * Hook to manage toast notifications.
 */
const useToast = () => {
  const [toast, setToast] = useState(false);
  const [toastDetails, setToastDetails] = useState({});
  const [toastStatus, setToastStatus] = useState({ alreadyShown: false });

  const showToast = useCallback((details, duration = 5000) => {
    setToast(true);
    setToastDetails(details);
    setTimeout(() => {
      setToast(false);
      setToastStatus({ alreadyShown: true });
    }, duration);
  }, []);

  const showToastMsg = useCallback((type, message, duration = 5000) => {
    setToast(true);
    setToastDetails({ isError: type === "error", message: message });
    setTimeout(() => {
      setToast(false);
      setToastStatus({ alreadyShown: true });
    }, duration);
  }, []);

  const closeToast = useCallback(() => setToast(false), []);

  return {
    toast,
    setToast,
    toastDetails,
    toastStatus,
    showToast,
    showToastMsg,
    closeToast,
  };
};

export default useToast;
