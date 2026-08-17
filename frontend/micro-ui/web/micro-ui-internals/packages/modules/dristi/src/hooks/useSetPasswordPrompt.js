import { useCallback, useState } from "react";
import { useHistory } from "react-router-dom";
import axiosInstance from "@egovernments/digit-ui-module-core/src/Utils/axiosInstance";

// localStorage: whether this user still needs to set a password (persisted at login from the user
// lookup, and re-armed right after registration). sessionStorage: whether the prompt has already
// been answered in this session, so it is not shown again on every screen the user visits.
const PROMPT_FLAG = "showPasswordSetupPrompt";
const PROMPT_HANDLED = "pwPromptHandled";

/**
 * Re-arms the prompt so the next screen that renders it shows it again. Called right after a user is
 * created through registration: the new user lands either on the registration success screen
 * (litigant, no approval needed) or on the approval-pending screen (advocate / advocate clerk), and
 * must be prompted to set a password on whichever of those screens they end up on. A user who
 * already has a password is never re-prompted.
 */
export const markPasswordPromptPending = () => {
  if (window.localStorage.getItem("hasPassword") === "true") return;
  window.localStorage.setItem(PROMPT_FLAG, "true");
  window.sessionStorage.removeItem(PROMPT_HANDLED);
};

/**
 * State and handlers for the "set a password" prompt shown over whichever screen a citizen without a
 * password lands on (home, registration success, approval pending). Shown once per session; the
 * user's choice is remembered via sessionStorage and "Don't remind again" is persisted server-side.
 */
const useSetPasswordPrompt = () => {
  const history = useHistory();

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(
    () => window.localStorage.getItem(PROMPT_FLAG) === "true" && window.sessionStorage.getItem(PROMPT_HANDLED) !== "true"
  );

  const dismissPrompt = useCallback(() => {
    window.sessionStorage.setItem(PROMPT_HANDLED, "true");
    setShowPasswordPrompt(false);
  }, []);

  const onSetPassword = useCallback(() => {
    dismissPrompt();
    history.push(`/${window?.contextPath}/citizen/dristi/home/password-settings`);
  }, [dismissPrompt, history]);

  const onRemindLater = useCallback(() => {
    dismissPrompt();
  }, [dismissPrompt]);

  const onDontRemindAgain = useCallback(async () => {
    try {
      await axiosInstance.post("/user/password/prompt/_suppress", {
        tenantId: window?.Digit?.ULBService?.getCurrentTenantId(),
        RequestInfo: {
          apiId: "Rainmaker",
          msgId: `${Date.now()}|${window?.Digit?.StoreData?.getCurrentLanguage?.() || "en_IN"}`,
          ts: 0,
          authToken: window.localStorage.getItem("token"),
          userInfo: window?.Digit?.UserService?.getUser()?.info,
        },
      });
    } catch (e) {
      // Even if suppression fails, don't block the user - just dismiss the prompt.
    }
    window.localStorage.setItem(PROMPT_FLAG, "false");
    dismissPrompt();
  }, [dismissPrompt]);

  return { showPasswordPrompt, onSetPassword, onRemindLater, onDontRemindAgain };
};

export default useSetPasswordPrompt;
