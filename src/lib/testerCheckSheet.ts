export type TesterCheckStatus = "ok" | "issue" | "not-tested";

export type TesterCheckActivity = {
  id: string;
  label: string;
};

export type TesterCheckSection = {
  id: string;
  title: string;
  activities: TesterCheckActivity[];
};

export const TESTER_CHECK_SECTIONS: TesterCheckSection[] = [
  {
    id: "account",
    title: "1. Getting started & account",
    activities: [
      { id: "landing", label: "Landing page is clear and easy to navigate" },
      { id: "register", label: "Register and verify an account" },
      { id: "login", label: "Log in, log out and return to the site" },
      { id: "password", label: "Password reset / resend verification is understandable" },
    ],
  },
  {
    id: "entry",
    title: "2. Competition entry & payment",
    activities: [
      { id: "competition", label: "Find and select the intended competition" },
      { id: "payment", label: "Complete the Stripe test payment" },
      { id: "access", label: "Competition access is available after test payment" },
    ],
  },
  {
    id: "predictions",
    title: "3. Predictions",
    activities: [
      { id: "manual", label: "Enter and edit predicted scores manually" },
      { id: "quick-pick", label: "Use Quick Pick" },
      { id: "countdown", label: "Prediction-lock countdown and wording are clear" },
      { id: "prediction-pdf", label: "Download the prediction PDF" },
    ],
  },
  {
    id: "results",
    title: "4. Leaderboard, results & scoring",
    activities: [
      { id: "leaderboard", label: "Leaderboard is clear and the right competition can be selected" },
      { id: "leaderboard-pdf", label: "Download the selected competition leaderboard PDF" },
      { id: "completed-match", label: "Completed-match result and Match Points are clear" },
      { id: "delta", label: "Prediction Delta / ranking movement makes sense" },
    ],
  },
  {
    id: "news",
    title: "5. News, help & information",
    activities: [
      { id: "news-buttons", label: "News competition buttons are easy to use" },
      { id: "news-content", label: "Competition introduction / round reports are useful" },
      { id: "manuals", label: "Help & Manuals are easy to find and useful" },
      { id: "chatbot", label: "Ask Perfect XV gives useful answers and links" },
    ],
  },
  {
    id: "social",
    title: "6. Invitations & communication",
    activities: [
      { id: "invite", label: "Invite Friends is easy to understand and use" },
      { id: "helpdesk", label: "Helpdesk escalation is clear if chatbot help is not enough" },
      { id: "preferences", label: "Email preferences / unsubscribe are understandable" },
    ],
  },
  {
    id: "usability",
    title: "7. Mobile & overall usability",
    activities: [
      { id: "mobile", label: "Pages work well on your phone / tablet / computer" },
      { id: "navigation", label: "Menus, buttons and links are easy to find" },
      { id: "speed", label: "The site feels responsive enough" },
      { id: "clarity", label: "Wording, instructions and error messages are clear" },
    ],
  },
];

export const TESTER_CHECK_ACTIVITY_IDS = new Set(
  TESTER_CHECK_SECTIONS.flatMap((section) =>
    section.activities.map((activity) => activity.id)
  )
);
