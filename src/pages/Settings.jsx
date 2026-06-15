import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";

import {
  applyTheme,
  loadSettings,
  saveSettings,
  themes,
} from "../utils/appSettings";

function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [message, setMessage] = useState("");

  /*
    Whenever settings change:
    1. Apply the selected theme.
    2. Save the settings in localStorage.
  */
  useEffect(() => {
    applyTheme(settings.theme);
    saveSettings(settings);
  }, [settings]);

  function selectTheme(themeName) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      theme: themeName,
    }));

    setMessage("Dashboard colors updated.");
  }

  async function changeNotifications(enabled) {
    /*
      Turn notifications off inside the application.
    */
    if (!enabled) {
      setSettings((currentSettings) => ({
        ...currentSettings,
        notificationsEnabled: false,
      }));

      setMessage("Notifications are turned off.");
      return;
    }

    /*
      Check whether the browser supports notifications.
    */
    if (!("Notification" in window)) {
      setMessage(
        "This browser does not support desktop notifications.",
      );

      return;
    }

    let permission = Notification.permission;

    /*
      Ask the user for notification permission.
    */
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      setSettings((currentSettings) => ({
        ...currentSettings,
        notificationsEnabled: false,
      }));

      setMessage(
        "Notification permission was not granted by the browser.",
      );

      return;
    }

    setSettings((currentSettings) => ({
      ...currentSettings,
      notificationsEnabled: true,
    }));

    setMessage("Notifications are turned on.");
  }

  function sendTestNotification() {
    if (!("Notification" in window)) {
      setMessage(
        "This browser does not support desktop notifications.",
      );

      return;
    }

    if (
      !settings.notificationsEnabled ||
      Notification.permission !== "granted"
    ) {
      setMessage(
        "Turn notifications on before sending a test.",
      );

      return;
    }

    new Notification("FindYourBuddy", {
      body: "Your notifications are working.",
    });

    setMessage("Test notification sent.");
  }

  return (
    <main className="main-content">
      <Topbar
        eyebrow="PERSONALIZATION"
        title="Settings"
      />

      <div className="settings-sections">
        <section className="settings-card">
          <div className="settings-card-heading">
            <p className="eyebrow">
              DASHBOARD APPEARANCE
            </p>

            <h2>Choose your colors</h2>

            <p>
              Select a theme for your dashboard. Your choice
              will be saved in this browser.
            </p>
          </div>

          <div className="theme-options">
            {Object.entries(themes).map(
              ([themeId, theme]) => (
                <button
                  key={themeId}
                  type="button"
                  className={
                    settings.theme === themeId
                      ? "theme-option active"
                      : "theme-option"
                  }
                  style={{
                    "--theme-accent": theme.accent,
                    "--theme-start": theme.heroStart,
                    "--theme-end": theme.heroEnd,
                  }}
                  onClick={() => selectTheme(themeId)}
                >
                  <span className="theme-preview">
                    <span />
                    <span />
                  </span>

                  <strong>{theme.name}</strong>

                  {settings.theme === themeId && (
                    <small>Selected</small>
                  )}
                </button>
              ),
            )}
          </div>
        </section>

        <section className="settings-card">
          <div className="notification-setting">
            <div>
              <p className="eyebrow">
                NOTIFICATIONS
              </p>

              <h2>Application notifications</h2>

              <p>
                Receive notifications about messages, friend
                requests, activities and community updates.
              </p>
            </div>

            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(event) =>
                  changeNotifications(event.target.checked)
                }
              />

              <span className="toggle-slider" />
            </label>
          </div>

          {settings.notificationsEnabled && (
            <button
              className="secondary-button"
              type="button"
              onClick={sendTestNotification}
            >
              Send test notification
            </button>
          )}

          <p className="notification-explanation">
            Turning notifications off here only disables them
            inside FindYourBuddy. Your browser may still remember
            the permission you previously selected.
          </p>
        </section>

        {message && (
          <div className="settings-message">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}

export default Settings;