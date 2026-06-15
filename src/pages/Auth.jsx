import { useState } from "react";

import { supabase } from "../lib/supabase";

function Auth() {
  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  const isSignUp = mode === "signup";

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage("");
    setErrorMessage("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage("Enter your email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        "Your password must contain at least 8 characters.",
      );

      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } =
          await supabase.auth.signUp({
            email: cleanEmail,
            password,

            options: {
              emailRedirectTo:
                window.location.origin,
            },
          });

        if (error) {
          throw error;
        }

        /*
          When email confirmation is enabled,
          the user normally receives an email
          before getting an active session.
        */
        if (data.session) {
          setMessage(
            "Your account was created and you are signed in.",
          );
        } else {
          setMessage(
            "Your account was created. Check your email and click the confirmation link.",
          );
        }
      } else {
        const { error } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (error) {
          throw error;
        }

        /*
          App.jsx listens for the successful
          sign-in and displays the dashboard.
        */
      }
    } catch (error) {
      console.error("Authentication error:", error);

      setErrorMessage(
        error.message ||
          "Authentication failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-presentation">
        <div className="auth-brand">
          <span>FYB</span>
          <strong>FindYourBuddy</strong>
        </div>

        <div className="auth-presentation-content">
          <p className="auth-eyebrow">
            DISCOVER · CONNECT · EXPERIENCE
          </p>

          <h1>
            New city.
            <br />
            New people.
            <br />
            New experiences.
          </h1>

          <p>
            Find people nearby for concerts, sports,
            swimming, parties, cultural events and
            everyday activities.
          </p>

          <div className="auth-features">
            <span>✓ Find local activities</span>
            <span>✓ Meet people with shared interests</span>
            <span>✓ Join or create communities</span>
          </div>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-card">
          <div className="auth-form-heading">
            <p className="eyebrow">
              {isSignUp
                ? "CREATE ACCOUNT"
                : "WELCOME BACK"}
            </p>

            <h2>
              {isSignUp
                ? "Join FindYourBuddy"
                : "Sign in to your account"}
            </h2>

            <p>
              {isSignUp
                ? "Create an account to begin discovering people and activities."
                : "Enter your details to continue to your dashboard."}
            </p>
          </div>

          <div className="auth-mode-buttons">
            <button
              type="button"
              className={
                mode === "login"
                  ? "auth-mode-button active"
                  : "auth-mode-button"
              }
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>

            <button
              type="button"
              className={
                mode === "signup"
                  ? "auth-mode-button active"
                  : "auth-mode-button"
              }
              onClick={() => switchMode("signup")}
            >
              Create account
            </button>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <div className="auth-field">
              <label htmlFor="auth-email">
                Email address
              </label>

              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">
                Password
              </label>

              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="At least 8 characters"
                autoComplete={
                  isSignUp
                    ? "new-password"
                    : "current-password"
                }
                minLength="8"
                required
              />
            </div>

            {isSignUp && (
              <div className="auth-field">
                <label htmlFor="confirm-password">
                  Confirm password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Enter the password again"
                  autoComplete="new-password"
                  minLength="8"
                  required
                />
              </div>
            )}

            {errorMessage && (
              <div className="auth-message error">
                {errorMessage}
              </div>
            )}

            {message && (
              <div className="auth-message success">
                {message}
              </div>
            )}

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="auth-switch-text">
            {isSignUp
              ? "Already have an account?"
              : "Do not have an account?"}

            <button
              type="button"
              onClick={() =>
                switchMode(
                  isSignUp ? "login" : "signup",
                )
              }
            >
              {isSignUp
                ? "Sign in"
                : "Create one"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Auth;