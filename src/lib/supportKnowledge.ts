export type SupportSource = {
  label: string;
  href: string;
};

export type SupportOption = {
  id: string;
  label: string;
  prompt: string;
};

export type SupportAnswer = {
  answer: string;
  sources: SupportSource[];
  matchedTopic: string | null;
  options: SupportOption[];
  needsChoice: boolean;
};

type SupportTopic = {
  id: string;
  title: string;
  optionLabel: string;
  optionPrompt: string;
  phrases: string[];
  keywords: string[];
  answer: string;
  sources: SupportSource[];
};

const topics: SupportTopic[] = [
  {
    id: "leaderboard",
    title: "Leaderboard and ranking",
    optionLabel: "Leaderboard ranking",
    optionPrompt: "Explain the leaderboard ranking order",
    phrases: ["leaderboard ranking", "ranking order", "tie break", "tiebreak", "why am i ranked"],
    keywords: ["leaderboard", "rank", "ranking", "tie", "wins", "perfect", "margins", "delta", "points"],
    answer:
      "Perfect XV ranks entrants in this exact order: 1) Points Total, 2) Correct Wins (correctly predicted draws count as correct outcomes), 3) Perfect Scores, 4) Correct Margins, and 5) Prediction Delta, where the lowest cumulative Prediction Delta ranks higher. If entrants are still equal after all five criteria, they remain jointly ranked.",
    sources: [
      { label: "User Manual - Leaderboard and Ranking", href: "/user-manual#leaderboard" },
      { label: "Competition Rules - Leaderboard Hierarchy", href: "/legal/rules" },
    ],
  },
  {
    id: "prediction-delta",
    title: "Prediction Delta",
    optionLabel: "Prediction Delta",
    optionPrompt: "Explain how Prediction Delta works",
    phrases: ["prediction delta", "cumulative prediction delta", "delta calculated", "delta mean"],
    keywords: ["delta", "difference", "margin", "negative", "positive", "cumulative", "prediction"],
    answer:
      "Prediction Delta measures how far the predicted points difference is from the actual points difference. Its magnitude is the absolute difference between those margins. It is negative when the predicted result is correct and positive when the predicted result is wrong. Cumulative Prediction Delta is the signed total across completed matches.",
    sources: [
      { label: "User Manual - Prediction Delta", href: "/user-manual#delta" },
      { label: "User Manual - Leaderboard and Ranking", href: "/user-manual#leaderboard" },
    ],
  },
  {
    id: "scoring",
    title: "Scoring",
    optionLabel: "Match scoring",
    optionPrompt: "Explain how match points are scored",
    phrases: ["how many points", "scoring system", "exact score", "correct margin", "match points"],
    keywords: ["score", "scoring", "points", "exact", "margin", "result", "bonus"],
    answer:
      "For each completed match, a correct match result earns 1 point, a correct margin adds 2 bonus points, and an exact score adds 3 bonus points. The bonuses stack, so an exact score earns 6 points in total.",
    sources: [
      { label: "User Manual - Scoring", href: "/user-manual#scoring" },
      { label: "Competition Rules - Points System", href: "/legal/rules" },
    ],
  },
  {
    id: "locking",
    title: "Prediction locking",
    optionLabel: "Prediction locking",
    optionPrompt: "Explain when predictions lock",
    phrases: ["when do predictions lock", "prediction deadline", "can i change prediction", "locked prediction"],
    keywords: ["lock", "locked", "deadline", "change", "edit", "kickoff", "kick-off", "stage", "prediction", "predictions"],
    answer:
      "Predictions lock by competition stage. Every fixture in a stage must be predicted before that stage begins, and the stage locks one minute before its first kick-off. The Six Nations is one tournament-wide stage. Once a stage is locked, its predictions cannot be entered or changed.",
    sources: [
      { label: "User Manual - Prediction Locking", href: "/user-manual#locking" },
      { label: "Competition Rules - Prediction Lock", href: "/legal/rules" },
    ],
  },
  {
    id: "predictions",
    title: "Entering and editing predictions",
    optionLabel: "Entering or editing predictions",
    optionPrompt: "Explain how to enter or edit predictions",
    phrases: ["make predictions", "enter prediction", "edit prediction", "save prediction", "prediction progress"],
    keywords: ["prediction", "predictions", "enter", "edit", "save", "fixture", "progress"],
    answer:
      "Open Predictions, enter a home score and away score for each fixture, and save each prediction. Saved predictions can be edited while that competition stage remains open. Prediction Progress shows how many fixtures already have saved predictions.",
    sources: [
      { label: "User Manual - Entering and Editing Predictions", href: "/user-manual#predictions" },
    ],
  },
  {
    id: "quick-pick",
    title: "Quick Pick",
    optionLabel: "Quick Pick",
    optionPrompt: "Explain Quick Pick",
    phrases: ["quick pick", "quickpick", "random predictions"],
    keywords: ["quick", "pick", "random", "generate"],
    answer:
      "Quick Pick generates and saves scores for the open fixtures to make rapid entry easier. It can replace existing open predictions, so review the generated scores before the locking deadline.",
    sources: [
      { label: "User Manual - Quick Pick", href: "/user-manual#quick-pick" },
    ],
  },
  {
    id: "verification-password",
    title: "Verification and password help",
    optionLabel: "Login, verification or password",
    optionPrompt: "Help with verification, login or password reset",
    phrases: ["verify email", "verification email", "forgot password", "reset password", "resend verification"],
    keywords: ["verify", "verification", "password", "reset", "login", "email", "resend"],
    answer:
      "New accounts must verify their email address. If a verification message is lost or expired, use Resend Verification Email on the Login page. If you cannot remember your password, use Forgot Password? to request a reset link. Do not create a second account just because a verification or reset message was missed.",
    sources: [
      { label: "User Manual - Account, Verification and Password", href: "/user-manual#account" },
      { label: "Login", href: "/login" },
    ],
  },
  {
    id: "completed-results",
    title: "Predictions after matches begin",
    optionLabel: "Completed matches and results",
    optionPrompt: "Explain what I see after matches are completed",
    phrases: ["completed matches", "after matches begin", "my match points", "results view", "leaderboard movement"],
    keywords: ["completed", "results", "movement", "match", "final", "points", "prediction", "predictions"],
    answer:
      "After matches begin, completed fixtures are added to the results view. Each completed match shows the final score, your locked prediction, Match Points and its scoring breakdown. Total Competition Points include completed matches only, and your current leaderboard position and movement update as results are completed.",
    sources: [
      { label: "User Manual - Predictions After Matches Begin", href: "/user-manual#results" },
    ],
  },
  {
    id: "competitions",
    title: "Choosing a competition",
    optionLabel: "Choosing a competition",
    optionPrompt: "Explain how to choose or switch competitions",
    phrases: ["choose competition", "switch competition", "multiple competitions"],
    keywords: ["competition", "competitions", "selector", "choose", "switch", "selected"],
    answer:
      "Perfect XV can run more than one competition. Where a competition selector is available, use it to choose the competition you want to view. Entries, predictions, leaderboard positions and results belong to the selected competition.",
    sources: [
      { label: "User Manual - Choosing a Competition", href: "/user-manual#competitions" },
    ],
  },
  {
    id: "entry-payment",
    title: "Competition entry and payment",
    optionLabel: "Competition entry or payment",
    optionPrompt: "Explain competition entry and payment",
    phrases: ["competition entry required", "payment required", "pay to enter", "stripe test"],
    keywords: ["payment", "pay", "entry", "stripe", "charge", "testing"],
    answer:
      "You can browse the site before entering a competition. If a competition requires payment, the Predictions page shows Competition Entry Required until payment is confirmed. During test mode, supplied Stripe test details create a fictitious payment only; no real charge is made.",
    sources: [
      { label: "User Manual - Competition Entry and Payment", href: "/user-manual#payment" },
    ],
  },
  {
    id: "prediction-record",
    title: "Prediction PDF and confirmation email",
    optionLabel: "Prediction PDF or confirmation email",
    optionPrompt: "Explain prediction records, PDFs and confirmation emails",
    phrases: ["prediction pdf", "confirmation email", "download predictions", "record of predictions"],
    keywords: ["pdf", "confirmation", "download", "record", "email", "locked"],
    answer:
      "Your Dashboard can provide a private PDF record of your predictions. After predictions lock, Perfect XV can also send an email containing your locked predictions so you have an independent record of what was submitted.",
    sources: [
      { label: "User Manual - Prediction PDF and Confirmation Email", href: "/user-manual#pdf" },
    ],
  },
  {
    id: "invite",
    title: "Invite friends",
    optionLabel: "Inviting friends",
    optionPrompt: "Explain how to invite friends",
    phrases: ["invite friends", "invite someone", "send invitation"],
    keywords: ["invite", "friend", "friends", "invitation", "email"],
    answer:
      "Use Invite Friends to Perfect XV to enter a person's first name, surname and email address. You can add multiple people before sending. Invitations are to the site generally; recipients register and choose the competitions they want to enter.",
    sources: [
      { label: "User Manual - Invite Friends", href: "/user-manual#invite" },
      { label: "Invite Friends", href: "/invite-friends" },
    ],
  },
  {
    id: "account-details",
    title: "Update account details",
    optionLabel: "Updating account details",
    optionPrompt: "Explain how to update my account details",
    phrases: ["change my details", "update account", "change name", "my account"],
    keywords: ["account", "details", "name", "update", "profile"],
    answer:
      "Use My Account to review and update the personal account details that Perfect XV allows you to maintain yourself. Administrators have separate controlled correction tools for support cases.",
    sources: [
      { label: "User Manual - Update Your Account Details", href: "/user-manual#account-details" },
      { label: "My Account", href: "/account" },
    ],
  },
  {
    id: "email-preferences",
    title: "Email preferences",
    optionLabel: "Email preferences",
    optionPrompt: "Explain email preferences or unsubscribing",
    phrases: ["unsubscribe", "email preferences", "stop emails", "optional emails"],
    keywords: ["email", "emails", "unsubscribe", "preferences", "announcements"],
    answer:
      "Email Preferences controls optional communications and unsubscribe choices. Essential transactional messages, such as verification, password reset or competition-critical notices, may be treated separately from optional announcements.",
    sources: [
      { label: "User Manual - Email Preferences", href: "/user-manual#email" },
      { label: "Email Preferences", href: "/email-preferences" },
    ],
  },
  {
    id: "fixtures",
    title: "Fixtures and live results",
    optionLabel: "Fixtures and live results",
    optionPrompt: "Explain fixtures and live results",
    phrases: ["live result", "live score", "fixture result", "official result"],
    keywords: ["fixture", "fixtures", "live", "result", "results", "score", "final", "venue"],
    answer:
      "Fixtures show the teams, round, kick-off time and available venue information. Live-score integration may update an in-play fixture where provider coverage is available. A fixture is added to completed results only after it is final.",
    sources: [
      { label: "User Manual - Fixtures and Live Results", href: "/user-manual#fixtures" },
    ],
  },
  {
    id: "heritage",
    title: "Heritage and History",
    optionLabel: "Heritage & History",
    optionPrompt: "Explain Heritage & History",
    phrases: ["heritage and history", "championship history", "rugby history"],
    keywords: ["heritage", "history", "archive", "records", "trophies", "venues", "players"],
    answer:
      "Heritage & History contains championship archive material covering eras, teams, players, records, trophies, venues, milestones and classic matches. It is reference content and does not affect competition scoring.",
    sources: [
      { label: "User Manual - Heritage & History", href: "/user-manual#heritage" },
      { label: "Open Heritage & History", href: "/heritage" },
    ],
  },
];

function normalise(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string) {
  return new Set(
    normalise(value)
      .split(" ")
      .filter((token) => token.length > 2)
  );
}

function rankTopics(message: string) {
  const query = normalise(message);
  const queryTokens = tokens(query);

  return topics
    .map((topic) => {
      let score = 0;

      for (const phrase of topic.phrases) {
        const normalisedPhrase = normalise(phrase);
        if (query.includes(normalisedPhrase)) score += 8;
      }

      for (const keyword of topic.keywords) {
        const normalisedKeyword = normalise(keyword);
        if (queryTokens.has(normalisedKeyword)) score += 3;
        else if (query.includes(normalisedKeyword)) score += 1;
      }

      return { topic, score };
    })
    .sort((a, b) => b.score - a.score);
}

function asOption(topic: SupportTopic): SupportOption {
  return {
    id: topic.id,
    label: topic.optionLabel,
    prompt: topic.optionPrompt,
  };
}

export function answerSupportTopic(topicId: string): SupportAnswer {
  const topic = topics.find((item) => item.id === topicId);

  if (!topic) {
    return {
      answer:
        "I could not match that option to approved Perfect XV help material. Please choose another support topic or check the User Manual.",
      sources: [{ label: "User Manual", href: "/user-manual" }],
      matchedTopic: null,
      options: [],
      needsChoice: false,
    };
  }

  return {
    answer: topic.answer,
    sources: topic.sources,
    matchedTopic: topic.title,
    options: [],
    needsChoice: false,
  };
}

export function answerSupportQuestion(message: string): SupportAnswer {
  const query = normalise(message);

  if (!query) {
    return {
      answer: "Ask me a question about using Perfect XV.",
      sources: [],
      matchedTopic: null,
      options: [],
      needsChoice: false,
    };
  }

  const ranked = rankTopics(query);
  const positive = ranked.filter((item) => item.score > 0);
  const best = positive[0];
  const second = positive[1];

  if (!best || best.score < 2) {
    return {
      answer:
        "I could not identify a reliable Perfect XV topic from that question. Try choosing one of these common areas, or check the User Manual.",
      sources: [
        { label: "User Manual", href: "/user-manual" },
        { label: "Competition Rules", href: "/legal/rules" },
      ],
      matchedTopic: null,
      options: [
        asOption(topics.find((topic) => topic.id === "predictions")!),
        asOption(topics.find((topic) => topic.id === "scoring")!),
        asOption(topics.find((topic) => topic.id === "verification-password")!),
      ],
      needsChoice: true,
    };
  }

  const clearPhraseMatch = best.score >= 8;
  const clearlyAhead = !second || best.score - second.score >= 4;

  if (clearPhraseMatch && clearlyAhead) {
    const related = positive
      .slice(1, 3)
      .filter((item) => item.score >= 2)
      .map((item) => asOption(item.topic));

    return {
      answer: best.topic.answer,
      sources: best.topic.sources,
      matchedTopic: best.topic.title,
      options: related,
      needsChoice: false,
    };
  }

  const likelyOptions = positive
    .filter((item) => item.score >= Math.max(2, best.score - 4))
    .slice(0, 3)
    .map((item) => asOption(item.topic));

  if (likelyOptions.length === 1) {
    return {
      answer: best.topic.answer,
      sources: best.topic.sources,
      matchedTopic: best.topic.title,
      options: [],
      needsChoice: false,
    };
  }

  return {
    answer:
      "I can interpret that a few ways. Which of these is closest to what you mean?",
    sources: [],
    matchedTopic: null,
    options: likelyOptions,
    needsChoice: true,
  };
}
