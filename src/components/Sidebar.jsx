const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
  },
  {
    id: "find-buddy",
    label: "Find Buddy",
  },
  {
  id: "events",
  label: "Events",
  },
  {
    id: "groups",
    label: "Communities",
  },
  {
    id: "messages",
    label: "Messages",
  },
  {
    id: "profile",
    label: "My Profile",
  },
  {
    id: "settings",
    label: "Settings",
  },
];

function Sidebar({
  activePage,
  onNavigate,
  currentUser,
  onSignOut,
}) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <span>FYB</span>

        <strong>
          FindYourBuddy
        </strong>
      </div>

      <nav className="navigation">
        {navigationItems.map(
          (item) => (
            <button
              key={item.id}
              type="button"
              className={
                activePage === item.id
                  ? "nav-item active"
                  : "nav-item"
              }
              onClick={() =>
                onNavigate(item.id)
              }
            >
              {item.label}
            </button>
          ),
        )}
      </nav>

      <div className="sidebar-profile">
        <div className="small-avatar">
          {currentUser?.initials ||
            "FY"}
        </div>

        <div className="sidebar-account">
          <strong>
            {currentUser?.displayName ||
              "Member"}
          </strong>

          <span
            title={
              currentUser?.email || ""
            }
          >
            {currentUser?.email}
          </span>

          <button
            className="logout-button"
            type="button"
            onClick={onSignOut}
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;