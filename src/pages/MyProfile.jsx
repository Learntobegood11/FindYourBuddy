import {
  useEffect,
  useState,
} from "react";

import Topbar from "../components/Topbar";
import { supabase } from "../lib/supabase";

const emptyProfile = {
  displayName: "",
  birthDate: "",
  city: "",
  occupation: "",
  favoriteActivities: "",
  biography: "",
  isDiscoverable: true,
};

function MyProfile({
  onProfileSaved,
}) {
  const [profile, setProfile] =
    useState(emptyProfile);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  /*
    Load the signed-in user's profile
    from Supabase when this page opens.
  */
  useEffect(() => {
    let pageIsActive = true;

    async function loadProfile() {
      setLoading(true);
      setErrorMessage("");

      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser();

      if (!pageIsActive) {
        return;
      }

      if (userError || !userData.user) {
        setErrorMessage(
          "Your account could not be loaded.",
        );

        setLoading(false);
        return;
      }

      const userId = userData.user.id;

      const [
        publicResult,
        privateResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(`
            display_name,
            city,
            occupation,
            favorite_activities,
            biography,
            is_discoverable
          `)
          .eq("id", userId)
          .maybeSingle(),

        supabase
          .from("profile_private")
          .select("birth_date")
          .eq("id", userId)
          .maybeSingle(),
      ]);

      if (!pageIsActive) {
        return;
      }

      if (publicResult.error) {
        console.error(
          "Could not load public profile:",
          publicResult.error,
        );

        setErrorMessage(
          publicResult.error.message,
        );

        setLoading(false);
        return;
      }

      if (privateResult.error) {
        console.error(
          "Could not load private profile:",
          privateResult.error,
        );

        setErrorMessage(
          privateResult.error.message,
        );

        setLoading(false);
        return;
      }

      const publicProfile =
        publicResult.data;

      const privateProfile =
        privateResult.data;

      /*
        When no database profile exists yet,
        try to prefill the form using the
        old browser profile.
      */
      let oldBrowserProfile = {};

      if (!publicProfile) {
        try {
          const savedProfile =
            localStorage.getItem(
              "findyourbuddy-profile",
            ) ||
            localStorage.getItem(
              "fanmatch-profile",
            );

          if (savedProfile) {
            oldBrowserProfile =
              JSON.parse(savedProfile);
          }
        } catch (error) {
          console.error(
            "Could not read old browser profile:",
            error,
          );
        }
      }

      setProfile({
        displayName:
          publicProfile?.display_name ??
          oldBrowserProfile.displayName ??
          "",

        birthDate:
          privateProfile?.birth_date ??
          oldBrowserProfile.birthDate ??
          "",

        city:
          publicProfile?.city ??
          oldBrowserProfile.city ??
          "",

        occupation:
          publicProfile?.occupation ??
          oldBrowserProfile.occupation ??
          "",

        favoriteActivities:
          Array.isArray(
            publicProfile?.favorite_activities,
          )
            ? publicProfile.favorite_activities.join(
                ", ",
              )
            : oldBrowserProfile.favoriteActivities ??
              oldBrowserProfile.favoriteTeam ??
              oldBrowserProfile.interests ??
              "",

        biography:
          publicProfile?.biography ??
          oldBrowserProfile.biography ??
          "",

        isDiscoverable:
          publicProfile?.is_discoverable ??
          true,
      });

      setLoading(false);
    }

    loadProfile();

    return () => {
      pageIsActive = false;
    };
  }, []);

  function updateField(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setProfile((currentProfile) => ({
      ...currentProfile,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const displayName =
      profile.displayName.trim();

    if (
      displayName.length < 2 ||
      displayName.length > 50
    ) {
      setErrorMessage(
        "Your display name must contain between 2 and 50 characters.",
      );

      return;
    }

    if (profile.city.trim().length > 80) {
      setErrorMessage(
        "Your city must contain 80 characters or fewer.",
      );

      return;
    }

    if (
      profile.occupation.trim().length >
      100
    ) {
      setErrorMessage(
        "Your occupation must contain 100 characters or fewer.",
      );

      return;
    }

    if (
      profile.biography.trim().length >
      500
    ) {
      setErrorMessage(
        "Your biography must contain 500 characters or fewer.",
      );

      return;
    }

    if (profile.birthDate) {
      const selectedBirthDate =
        new Date(
          `${profile.birthDate}T00:00:00`,
        );

      if (
        Number.isNaN(
          selectedBirthDate.getTime(),
        ) ||
        selectedBirthDate > new Date()
      ) {
        setErrorMessage(
          "Enter a valid date of birth.",
        );

        return;
      }
    }

    const activities =
      profile.favoriteActivities
        .split(",")
        .map((activity) =>
          activity.trim(),
        )
        .filter(Boolean)
        .slice(0, 20);

    setSaving(true);

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setErrorMessage(
        "Your session has expired. Sign in again.",
      );

      setSaving(false);
      return;
    }

    const userId = userData.user.id;
    const updatedAt =
      new Date().toISOString();

    const publicProfile = {
      id: userId,
      display_name: displayName,
      city:
        profile.city.trim() || null,
      occupation:
        profile.occupation.trim() ||
        null,
      favorite_activities:
        activities,
      biography:
        profile.biography.trim() ||
        null,
      is_discoverable:
        profile.isDiscoverable,
      updated_at: updatedAt,
    };

    const privateProfile = {
      id: userId,
      birth_date:
        profile.birthDate || null,
      updated_at: updatedAt,
    };

    const [
      publicResult,
      privateResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .upsert(
          publicProfile,
          {
            onConflict: "id",
          },
        ),

      supabase
        .from("profile_private")
        .upsert(
          privateProfile,
          {
            onConflict: "id",
          },
        ),
    ]);

    if (publicResult.error) {
      console.error(
        "Could not save public profile:",
        publicResult.error,
      );

      setErrorMessage(
        publicResult.error.message,
      );

      setSaving(false);
      return;
    }

    if (privateResult.error) {
      console.error(
        "Could not save private profile:",
        privateResult.error,
      );

      setErrorMessage(
        privateResult.error.message,
      );

      setSaving(false);
      return;
    }

    if (onProfileSaved) {
  onProfileSaved();
}
    setMessage(
      "Your profile was saved securely in the database.",
    );

    setSaving(false);
  }

  function resetForm() {
    const shouldReset =
      window.confirm(
        "Clear the form? This will not delete your saved profile unless you click Save afterward.",
      );

    if (!shouldReset) {
      return;
    }

    setProfile(emptyProfile);
    setMessage("");
    setErrorMessage("");
  }

  if (loading) {
    return (
      <main className="main-content">
        <Topbar
          eyebrow="YOUR ACCOUNT"
          title="My profile"
        />

        <div className="profile-loading">
          Loading your profile...
        </div>
      </main>
    );
  }

  return (
    <main className="main-content">
      <Topbar
        eyebrow="YOUR ACCOUNT"
        title="My profile"
      />

      <form
        className="profile-form"
        onSubmit={saveProfile}
      >
        <div className="form-introduction">
          <h2>Profile information</h2>

          <p>
            Your public profile helps other
            people discover you. Your exact
            date of birth is stored separately
            as private information.
          </p>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="displayName">
              Display name
            </label>

            <input
              id="displayName"
              name="displayName"
              type="text"
              value={profile.displayName}
              onChange={updateField}
              minLength="2"
              maxLength="50"
              placeholder="For example: Maya"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="birthDate">
              Date of birth
            </label>

            <input
              id="birthDate"
              name="birthDate"
              type="date"
              value={profile.birthDate}
              onChange={updateField}
            />

            <small>
              This is private and is not shown
              directly to other users.
            </small>
          </div>

          <div className="form-field">
            <label htmlFor="city">
              City
            </label>

            <input
              id="city"
              name="city"
              type="text"
              value={profile.city}
              onChange={updateField}
              maxLength="80"
              placeholder="For example: Hannover"
            />
          </div>

          <div className="form-field">
            <label htmlFor="occupation">
              Occupation
            </label>

            <input
              id="occupation"
              name="occupation"
              type="text"
              value={profile.occupation}
              onChange={updateField}
              maxLength="100"
              placeholder="For example: Student"
            />
          </div>

          <div className="form-field full-form-field">
            <label htmlFor="favoriteActivities">
              Favorite activities
            </label>

            <input
              id="favoriteActivities"
              name="favoriteActivities"
              type="text"
              value={
                profile.favoriteActivities
              }
              onChange={updateField}
              placeholder="Concerts, swimming, football, coffee"
            />

            <small>
              Separate activities with commas.
            </small>
          </div>

          <div className="form-field full-form-field">
            <label htmlFor="biography">
              About you
            </label>

            <textarea
              id="biography"
              name="biography"
              value={profile.biography}
              onChange={updateField}
              maxLength="500"
              rows="6"
              placeholder="Tell other people a little about yourself."
            />

            <small>
              {profile.biography.length}/500
              characters
            </small>
          </div>

          <label className="profile-checkbox full-form-field">
            <input
              name="isDiscoverable"
              type="checkbox"
              checked={
                profile.isDiscoverable
              }
              onChange={updateField}
            />

            <span>
              <strong>
                Show me in buddy discovery
              </strong>

              <small>
                When disabled, other users
                cannot find your public profile.
              </small>
            </span>
          </label>
        </div>

        {errorMessage && (
          <div className="auth-message error profile-status-message">
            {errorMessage}
          </div>
        )}

        {message && (
          <div className="auth-message success profile-status-message">
            {message}
          </div>
        )}

        <div className="form-actions">
          <button
            className="primary-button"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save profile"}
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={resetForm}
            disabled={saving}
          >
            Clear form
          </button>
        </div>
      </form>
    </main>
  );
}

export default MyProfile;