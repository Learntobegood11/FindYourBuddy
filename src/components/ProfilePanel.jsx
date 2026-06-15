function ProfilePanel({ buddy }) {
  function sendBuddyRequest() {
    alert(`Buddy request sent to ${buddy.name}`);
  }

  function sendMessage() {
    alert(`A future message conversation with ${buddy.name} will open here.`);
  }

  return (
    <aside className="details-panel">
      <p className="eyebrow">SELECTED PROFILE</p>

      <div className="large-avatar">{buddy.initials}</div>

      <h2>
        {buddy.name}, {buddy.age}
      </h2>

      <p className="location">{buddy.city}</p>

      <div className="profile-section">
        <h3>About</h3>
        <p>{buddy.description}</p>
      </div>

      <div className="profile-section">
        <h3>Occupation</h3>
        <p>{buddy.occupation}</p>
      </div>

      <div className="profile-section">
        <h3>Favorite team</h3>
        <p>{buddy.favoriteTeam}</p>
      </div>

      <div className="profile-section">
        <h3>Interests</h3>

        <div className="tags">
          {buddy.interests.map((interest) => (
            <span key={interest}>{interest}</span>
          ))}
        </div>
      </div>

      <button
        className="primary-button full-width"
        onClick={sendBuddyRequest}
      >
        Send buddy request
      </button>

      <button
        className="secondary-button full-width"
        onClick={sendMessage}
      >
        Send message
      </button>
    </aside>
  );
}

export default ProfilePanel;