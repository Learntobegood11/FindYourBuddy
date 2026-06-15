function createFutureDate(daysFromNow, hour, minute = 0) {
  const date = new Date();

  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);

  return date.toISOString();
}

export const events = [
  {
    id: 1,
    title: "Football Match Meetup",
    communityId: "sports",
    city: "Hannover",
    venue: "Kröpcke",
    startAt: createFutureDate(2, 17, 30),
    description:
      "Meet other supporters in the city centre before going to the match together.",
    attendees: 8,
    capacity: 12,
    priceLabel: "Ticket required",
    host: "Lena",
  },
  {
    id: 2,
    title: "Newcomers Live Music Night",
    communityId: "music",
    city: "Hannover",
    venue: "MusikZentrum",
    startAt: createFutureDate(4, 19, 0),
    description:
      "A relaxed live music evening for people who are new to Hannover.",
    attendees: 6,
    capacity: 10,
    priceLabel: "€8 entry",
    host: "Daniel",
  },
  {
    id: 3,
    title: "Saturday Swimming Session",
    communityId: "wellness",
    city: "Hannover",
    venue: "Stadionbad",
    startAt: createFutureDate(5, 10, 30),
    description:
      "Casual swimming session followed by coffee. All swimming levels are welcome.",
    attendees: 4,
    capacity: 8,
    priceLabel: "Pool entry",
    host: "Amira",
  },
  {
    id: 4,
    title: "New in Town Coffee Meetup",
    communityId: "social",
    city: "Hannover",
    venue: "Old Town Café",
    startAt: createFutureDate(6, 15, 0),
    description:
      "Meet other newcomers, make friends and exchange recommendations about the city.",
    attendees: 9,
    capacity: 14,
    priceLabel: "Free",
    host: "Maya",
  },
  {
    id: 5,
    title: "City Park Running Group",
    communityId: "outdoors",
    city: "Hannover",
    venue: "Maschpark",
    startAt: createFutureDate(7, 9, 0),
    description:
      "An easy social run for beginners and regular runners.",
    attendees: 7,
    capacity: 15,
    priceLabel: "Free",
    host: "Jonas",
  },
  {
    id: 6,
    title: "Museum and Art Walk",
    communityId: "culture",
    city: "Hannover",
    venue: "Sprengel Museum",
    startAt: createFutureDate(8, 13, 0),
    description:
      "Visit the museum together and finish the afternoon with a walk around the lake.",
    attendees: 5,
    capacity: 10,
    priceLabel: "Museum entry",
    host: "Sara",
  },
  {
    id: 7,
    title: "International Party Meetup",
    communityId: "nightlife",
    city: "Berlin",
    venue: "Friedrichshain",
    startAt: createFutureDate(3, 21, 0),
    description:
      "Meet before the party so nobody has to arrive alone.",
    attendees: 11,
    capacity: 16,
    priceLabel: "Entry required",
    host: "Alex",
  },
  {
    id: 8,
    title: "Sunday Language Exchange",
    communityId: "learning",
    city: "Berlin",
    venue: "Alexanderplatz Café",
    startAt: createFutureDate(5, 14, 0),
    description:
      "Practise languages and meet international people living in Berlin.",
    attendees: 12,
    capacity: 20,
    priceLabel: "Free",
    host: "Nora",
  },
  {
    id: 9,
    title: "Harbour Walk for Newcomers",
    communityId: "outdoors",
    city: "Hamburg",
    venue: "Landungsbrücken",
    startAt: createFutureDate(4, 11, 0),
    description:
      "A relaxed walk around the harbour with people who recently moved to Hamburg.",
    attendees: 7,
    capacity: 14,
    priceLabel: "Free",
    host: "Sara",
  },
  {
    id: 10,
    title: "Indie Concert Buddy Group",
    communityId: "music",
    city: "Hamburg",
    venue: "Schanzenviertel",
    startAt: createFutureDate(9, 19, 30),
    description:
      "Find concert buddies and attend a local indie music show together.",
    attendees: 5,
    capacity: 8,
    priceLabel: "Ticket required",
    host: "Leon",
  },
  {
    id: 11,
    title: "Weekend Football Watch Party",
    communityId: "sports",
    city: "Bremen",
    venue: "City Sports Bar",
    startAt: createFutureDate(3, 16, 0),
    description:
      "Watch the weekend match with a friendly group of local supporters.",
    attendees: 10,
    capacity: 18,
    priceLabel: "Free",
    host: "Jonas",
  },
  {
    id: 12,
    title: "Creative People Meetup",
    communityId: "social",
    city: "Bremen",
    venue: "Quarter Café",
    startAt: createFutureDate(8, 18, 0),
    description:
      "An informal evening for designers, photographers, artists and creative newcomers.",
    attendees: 6,
    capacity: 12,
    priceLabel: "Free",
    host: "Amira",
  },
];