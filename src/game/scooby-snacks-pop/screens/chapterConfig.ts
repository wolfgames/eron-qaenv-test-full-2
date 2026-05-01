/**
 * chapterConfig — constants and copy for chapter system.
 *
 * Chapter interstitials have real copy (guardrail #15 — no placeholder text).
 */

/** Auto-advance delay for chapter complete screen (4 seconds). */
export const CHAPTER_COMPLETE_AUTOADVANCE_MS = 4000;

export interface ChapterDef {
  number: number;
  name: string;
  location: string;
  emoji: string;
  interstitialText: string;
}

export const CHAPTERS: ChapterDef[] = [
  {
    number: 1,
    name: 'The Haunted Mansion',
    location: 'Coolsville, OH',
    emoji: '🏚️',
    interstitialText: "A mysterious call brings Mystery Inc. to a haunted mansion. Scooby Snacks are hidden everywhere! Let's find them!",
  },
  {
    number: 2,
    name: 'Mystery Woods',
    location: 'Dark Forest',
    emoji: '🌳',
    interstitialText: "Deep in the woods, someone's been stealing Scooby Snacks from the park rangers. Can Scooby sniff them out?",
  },
  {
    number: 3,
    name: 'Castle Ramparts',
    location: 'Blackwood Castle',
    emoji: '🏰',
    interstitialText: "An old castle hides a treasure trove of Scooby Snacks. But the ghost knight won't give them up without a fight!",
  },
  {
    number: 4,
    name: 'Sunken Ship',
    location: 'Crystal Cove',
    emoji: '🌊',
    interstitialText: "An underwater mystery! A sunken ship holds the ultimate Scooby Snack collection. Dive in, gang!",
  },
  {
    number: 5,
    name: 'Desert Ruins',
    location: 'Sphinx Canyon',
    emoji: '🌋',
    interstitialText: "Ancient ruins in the desert hold Scooby Snacks guarded by a mummy! Scooby, are you brave enough?",
  },
];
