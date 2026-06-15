import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./App.css";
import Events from "./pages/Events";
import Sidebar from "./components/Sidebar";
import ProfilePanel from "./components/ProfilePanel";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import FindBuddy from "./pages/FindBuddy";
import Groups from "./pages/Groups";
import Messages from "./pages/Messages";
import MyProfile from "./pages/MyProfile";
import Settings from "./pages/Settings";

import { buddies } from "./data/buddies";

import {
  applyTheme,
  loadSettings,
} from "./utils/appSettings";

import { supabase } from "./lib/supabase";

function createInitials(name) {
  if (!name) {
    return "FY";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function App() {
  const [session, setSession] =
    useState(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [
    userProfile,
    setUserProfile,
  ] = useState(null);

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(true);

  /*
    Changing this number tells App.jsx
    to load the profile from Supabase again.
  */
  const [
    profileRefreshKey,
    setProfileRefreshKey,
  ] = useState(0);

  const [activePage, setActivePage] =
    useState("dashboard");

  const [
    selectedBuddy,
    setSelectedBuddy,
  ] = useState(buddies[0] || null);

  /*
    Load the selected dashboard theme.
  */
  useEffect(() => {
    const savedSettings =
      loadSettings();

    applyTheme(savedSettings.theme);
  }, []);

  /*
    Load the current authentication session
    and listen for login/logout changes.
  */
  useEffect(() => {
    let componentIsMounted = true;

    async function loadSession() {
      const { data, error } =
        await supabase.auth.getSession();

      if (!componentIsMounted) {
        return;
      }

      if (error) {
        console.error(
          "Could not load authentication session:",
          error.message,
        );
      }

      setSession(data.session ?? null);
      setAuthLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setAuthLoading(false);

        /*
          Return to the Dashboard whenever
          the login state changes.
        */
        setActivePage("dashboard");
      },
    );

    return () => {
      componentIsMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
    Load the signed-in user's public profile
    from the profiles table.
  */
  useEffect(() => {
    let requestIsActive = true;

    async function loadUserProfile() {
      const userId =
        session?.user?.id;

      if (!userId) {
        setUserProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      const { data, error } =
        await supabase
          .from("profiles")
          .select(`
            id,
            display_name,
            city,
            occupation,
            favorite_activities,
            biography,
            avatar_path,
            is_discoverable
          `)
          .eq("id", userId)
          .maybeSingle();

      if (!requestIsActive) {
        return;
      }

      if (error) {
        console.error(
          "Could not load user profile:",
          error,
        );

        /*
          The app can still work using
          the email as a temporary name.
        */
        setUserProfile(null);
        setProfileLoading(false);
        return;
      }

      setUserProfile(data);
      setProfileLoading(false);
    }

    loadUserProfile();

    return () => {
      requestIsActive = false;
    };
  }, [
    session?.user?.id,
    profileRefreshKey,
  ]);

  /*
    Convert the Supabase database fields
    into a simpler object for the components.
  */
  const currentUser = useMemo(() => {
    const email =
      session?.user?.email || "";

    const emailName =
      email.split("@")[0] || "Member";

    const displayName =
      userProfile?.display_name ||
      emailName;

    return {
      id: session?.user?.id || "",
      email,
      displayName,
      initials:
        createInitials(displayName),
      city: userProfile?.city || "",
      occupation:
        userProfile?.occupation || "",
      favoriteActivities:
        Array.isArray(
          userProfile?.favorite_activities,
        )
          ? userProfile.favorite_activities
          : [],
      biography:
        userProfile?.biography || "",
      avatarPath:
        userProfile?.avatar_path || null,
      isDiscoverable:
        userProfile?.is_discoverable ??
        true,
      hasProfile: Boolean(userProfile),
    };
  }, [session, userProfile]);

  const showBuddyPanel =
    activePage === "find-buddy";

  function navigateTo(pageName) {
    setActivePage(pageName);
  }

  function selectBuddy(buddy) {
    setSelectedBuddy(buddy);
  }

  function openBuddyFromDashboard(
    buddy,
  ) {
    setSelectedBuddy(buddy);
    setActivePage("find-buddy");
  }

  /*
    MyProfile calls this after saving.
    It makes App.jsx reload the profile,
    updating the sidebar and Dashboard.
  */
  function handleProfileSaved() {
    setProfileRefreshKey(
      (currentKey) =>
        currentKey + 1,
    );
  }

  async function signOut() {
    const { error } =
      await supabase.auth.signOut({
        scope: "local",
      });

    if (error) {
      console.error(
        "Could not sign out:",
        error.message,
      );

      window.alert(
        "Sign out failed. Please try again.",
      );

      return;
    }

    setUserProfile(null);
    setActivePage("dashboard");
  }

  function renderCurrentPage() {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            currentUser={currentUser}
            onNavigate={navigateTo}
            onSelectBuddy={
              openBuddyFromDashboard
            }
          />
        );
      case "events":
        return (
          <Events
            currentUser={currentUser}
    />
        );  

      case "find-buddy":
        return (
          <FindBuddy
            currentUser={currentUser}
            onSelectBuddy={selectBuddy}
          />
        );

      case "groups":
        return (
          <Groups
            currentUser={currentUser}
          />
        );

      case "messages":
        return (
          <Messages
            currentUser={currentUser}
          />
        );

      case "profile":
        return (
          <MyProfile
            onProfileSaved={
              handleProfileSaved
            }
          />
        );

      case "settings":
        return <Settings />;

      default:
        return (
          <Dashboard
            currentUser={currentUser}
            onNavigate={navigateTo}
            onSelectBuddy={
              openBuddyFromDashboard
            }
          />
        );
    }
  }

  /*
    Wait until Supabase checks both the
    authentication session and profile.
  */
  if (
    authLoading ||
    (session && profileLoading)
  ) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-logo">
          FYB
        </div>

        <p>
          Loading FindYourBuddy...
        </p>
      </div>
    );
  }

  /*
    Logged-out users see only the
    authentication page.
  */
  if (!session) {
    return <Auth />;
  }

  return (
    <div
      className={
        showBuddyPanel
          ? "app-shell"
          : "app-shell no-details"
      }
    >
      <Sidebar
        activePage={activePage}
        onNavigate={navigateTo}
        currentUser={currentUser}
        onSignOut={signOut}
      />

      {renderCurrentPage()}

      {showBuddyPanel &&
        selectedBuddy && (
          <ProfilePanel
            buddy={selectedBuddy}
          />
        )}
    </div>
  );
}

export default App;