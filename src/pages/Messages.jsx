import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";
import { buddies } from "../data/buddies";

const FRIENDS_STORAGE_KEY = "findyourbuddy-friends";
const MESSAGES_STORAGE_KEY = "findyourbuddy-messages";

/*
  These are the IDs of the demonstration friends.

  Check src/data/buddies.js and make sure people
  with IDs 1, 3 and 5 exist.
*/
const defaultFriendIds = [1, 3, 5];

const defaultMessages = {
  1: [
    {
      id: "message-maya-1",
      sender: "friend",
      text: "Hi! Would you like to go to the concert this weekend?",
      sentAt: new Date(
        Date.now() - 1000 * 60 * 60 * 3,
      ).toISOString(),
    },
    {
      id: "message-maya-2",
      sender: "me",
      text: "Yes, that sounds great. What time does it start?",
      sentAt: new Date(
        Date.now() - 1000 * 60 * 60 * 2,
      ).toISOString(),
    },
  ],

  3: [
    {
      id: "message-sara-1",
      sender: "friend",
      text: "Would you like to join the museum walk?",
      sentAt: new Date(
        Date.now() - 1000 * 60 * 60 * 5,
      ).toISOString(),
    },
  ],

  5: [
    {
      id: "message-amira-1",
      sender: "friend",
      text: "Welcome to the city! Let me know when you are free for coffee.",
      sentAt: new Date(
        Date.now() - 1000 * 60 * 60 * 24,
      ).toISOString(),
    },
  ],
};

function loadFriendIds() {
  try {
    const savedFriendIds = localStorage.getItem(
      FRIENDS_STORAGE_KEY,
    );

    if (savedFriendIds) {
      return JSON.parse(savedFriendIds);
    }
  } catch (error) {
    console.error("Could not load friends:", error);
  }

  return defaultFriendIds;
}

function loadMessages() {
  try {
    const savedMessages = localStorage.getItem(
      MESSAGES_STORAGE_KEY,
    );

    if (savedMessages) {
      return JSON.parse(savedMessages);
    }
  } catch (error) {
    console.error("Could not load messages:", error);
  }

  return defaultMessages;
}

function createMessageId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `message-${Date.now()}`;
}

function formatMessageTime(dateValue) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue));
}

function Messages() {
  const [friendIds] = useState(loadFriendIds);

  const [messagesByFriend, setMessagesByFriend] =
    useState(loadMessages);

  const [selectedFriendId, setSelectedFriendId] =
    useState(friendIds[0] || null);

  const [searchText, setSearchText] = useState("");
  const [newMessage, setNewMessage] = useState("");

  /*
    Save messages every time they change.
  */
  useEffect(() => {
    localStorage.setItem(
      MESSAGES_STORAGE_KEY,
      JSON.stringify(messagesByFriend),
    );
  }, [messagesByFriend]);

  /*
    Select only the people whose IDs are inside
    defaultFriendIds or the saved friends list.
  */
  const friends = buddies.filter((buddy) =>
    friendIds.includes(buddy.id),
  );

  const filteredFriends = friends.filter((friend) => {
    const searchableText = [
      friend.name,
      friend.city,
      friend.occupation,
      friend.favoriteTeam,
      ...(friend.interests || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(
      searchText.toLowerCase(),
    );
  });

  const selectedFriend = friends.find(
    (friend) => friend.id === selectedFriendId,
  );

  const currentMessages =
    messagesByFriend[selectedFriendId] || [];

  function sendMessage(event) {
    event.preventDefault();

    const cleanedMessage = newMessage.trim();

    if (!cleanedMessage || !selectedFriendId) {
      return;
    }

    const message = {
      id: createMessageId(),
      sender: "me",
      text: cleanedMessage,
      sentAt: new Date().toISOString(),
    };

    setMessagesByFriend((currentMessagesByFriend) => ({
      ...currentMessagesByFriend,

      [selectedFriendId]: [
        ...(currentMessagesByFriend[selectedFriendId] || []),
        message,
      ],
    }));

    setNewMessage("");
  }

  return (
    <main className="main-content">
      <Topbar
        eyebrow="CONVERSATIONS"
        title="Messages"
      />

      <section className="messages-layout">
        <aside className="friends-panel">
          <div className="friends-panel-header">
            <div>
              <p className="eyebrow">FRIENDS</p>
              <h2>Your buddies</h2>
            </div>

            <span className="friends-count">
              {friends.length}
            </span>
          </div>

          <input
            className="friends-search"
            type="search"
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
            placeholder="Search friends"
          />

          <div className="friends-list">
            {filteredFriends.map((friend) => {
              const friendMessages =
                messagesByFriend[friend.id] || [];

              const lastMessage =
                friendMessages[
                  friendMessages.length - 1
                ];

              return (
                <button
                  key={friend.id}
                  type="button"
                  className={
                    selectedFriendId === friend.id
                      ? "friend-row active"
                      : "friend-row"
                  }
                  onClick={() =>
                    setSelectedFriendId(friend.id)
                  }
                >
                  <div className="friend-avatar">
                    {friend.initials ||
                      friend.name.slice(0, 1)}
                  </div>

                  <div className="friend-row-content">
                    <div className="friend-row-heading">
                      <strong>{friend.name}</strong>
                      <span>{friend.city}</span>
                    </div>

                    <p>
                      {lastMessage?.text ||
                        "Start a conversation"}
                    </p>
                  </div>
                </button>
              );
            })}

            {filteredFriends.length === 0 && (
              <div className="friends-empty">
                No friends matched your search.
              </div>
            )}
          </div>
        </aside>

        <section className="conversation-panel">
          {selectedFriend ? (
            <>
              <header className="conversation-header">
                <div className="friend-avatar large">
                  {selectedFriend.initials ||
                    selectedFriend.name.slice(0, 1)}
                </div>

                <div>
                  <h2>{selectedFriend.name}</h2>

                  <p>
                    {selectedFriend.city}
                    {selectedFriend.occupation
                      ? ` · ${selectedFriend.occupation}`
                      : ""}
                  </p>
                </div>
              </header>

              <div className="conversation-messages">
                {currentMessages.length > 0 ? (
                  currentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={
                        message.sender === "me"
                          ? "message-bubble-row mine"
                          : "message-bubble-row"
                      }
                    >
                      <div className="message-bubble">
                        <p>{message.text}</p>

                        <span>
                          {formatMessageTime(
                            message.sentAt,
                          )}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="conversation-empty">
                    <h3>Start the conversation</h3>

                    <p>
                      Send your first message to{" "}
                      {selectedFriend.name}.
                    </p>
                  </div>
                )}
              </div>

              <form
                className="message-composer"
                onSubmit={sendMessage}
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(event) =>
                    setNewMessage(event.target.value)
                  }
                  placeholder={`Message ${selectedFriend.name}`}
                />

                <button
                  className="primary-button"
                  type="submit"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="conversation-empty">
              <h2>No friend selected</h2>

              <p>
                Select a friend from the list to open a
                conversation.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default Messages;