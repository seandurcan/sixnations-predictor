"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Source = {
  label: string;
  href: string;
};

type SupportOption = {
  id: string;
  label: string;
  prompt: string;
};

type SupportAction = {
  label: string;
  href: string;
};

type HelpdeskStatus = "idle" | "sending" | "sent";

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
  sources?: Source[];
  options?: SupportOption[];
  needsChoice?: boolean;
  action?: SupportAction | null;
  interactionId?: string | null;
  feedback?: boolean | null;
  question?: string;
  helpdeskEmail?: string;
  helpdeskStatus?: HelpdeskStatus;
  helpdeskError?: string;
  ticketId?: string;
  emailStatus?: string;
  whatsappStatus?: string;
};

const suggestedQuestions = [
  "How is the leaderboard ranked?",
  "How is Prediction Delta calculated?",
  "When do predictions lock?",
  "How do I reset my password?",
];

const welcomeMessage: Message = {
  id: 1,
  role: "assistant",
  text:
    "I can help with Perfect XV rules and site features using the approved User Manual and Competition Rules. I cannot view or change your account, predictions or payment details.",
  sources: [
    { label: "User Manual", href: "/user-manual" },
    { label: "Competition Rules", href: "/legal/rules" },
  ],
};

export default function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [sending, setSending] = useState(false);
  const nextId = useRef(2);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  async function requestSupport(
    payload: { message?: string; topicId?: string; interactionId?: string },
    userText?: string,
    originalQuestion?: string
  ) {
    if (sending) return;

    if (userText) {
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "user",
          text: userText,
        },
      ]);
    }

    setSending(true);

    try {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      const assistantMessage: Message = {
        id: nextId.current++,
        role: "assistant",
        text:
          response.ok && typeof result.answer === "string"
            ? result.answer
            : result.error || "Perfect XV Support could not answer that question.",
        sources: response.ok && Array.isArray(result.sources) ? result.sources : undefined,
        options: response.ok && Array.isArray(result.options) ? result.options : undefined,
        needsChoice: response.ok && result.needsChoice === true,
        action:
          response.ok &&
          result.action &&
          typeof result.action.label === "string" &&
          typeof result.action.href === "string"
            ? result.action
            : null,
        interactionId:
          response.ok && typeof result.interactionId === "string"
            ? result.interactionId
            : payload.interactionId ?? null,
        feedback: null,
        question: originalQuestion ?? userText ?? payload.message,
        helpdeskEmail: "",
        helpdeskStatus: "idle",
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          text:
            "Perfect XV Support is temporarily unavailable. Please use the User Manual or Competition Rules.",
          sources: [
            { label: "User Manual", href: "/user-manual" },
            { label: "Competition Rules", href: "/legal/rules" },
          ],
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || sending) return;

    setInput("");
    await requestSupport({ message: trimmed }, trimmed, trimmed);
  }

  async function chooseOption(option: SupportOption, message: Message) {
    if (sending) return;

    await requestSupport(
      {
        topicId: option.id,
        ...(message.interactionId ? { interactionId: message.interactionId } : {}),
      },
      option.label,
      message.question
    );
  }

  async function sendFeedback(messageId: number, interactionId: string, helpful: boolean) {
    // Update the UI immediately. Helpdesk escalation must never depend on
    // the optional feedback API succeeding.
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? {
              ...message,
              feedback: helpful,
              helpdeskError: undefined,
            }
          : message
      )
    );

    try {
      await fetch("/api/support/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interactionId, helpful }),
      });
    } catch {
      // Feedback is optional; failure must not block support or helpdesk escalation.
    }
  }

  function updateHelpdeskEmail(messageId: number, value: string) {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, helpdeskEmail: value, helpdeskError: undefined }
          : message
      )
    );
  }

  async function escalateToHelpdesk(message: Message) {
    const requesterEmail = message.helpdeskEmail?.trim() ?? "";
    const question = message.question?.trim() ?? "";

    if (!requesterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)) {
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? { ...item, helpdeskError: "Enter a valid email address so the helpdesk can reply." }
            : item
        )
      );
      return;
    }

    if (!question) {
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? { ...item, helpdeskError: "The original support question is unavailable." }
            : item
        )
      );
      return;
    }

    setMessages((current) =>
      current.map((item) =>
        item.id === message.id
          ? { ...item, helpdeskStatus: "sending", helpdeskError: undefined }
          : item
      )
    );

    try {
      const response = await fetch("/api/support/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterEmail,
          question,
          chatbotAnswer: message.text,
          interactionId: message.interactionId ?? undefined,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to send the question to the helpdesk.");
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? {
                ...item,
                helpdeskStatus: "sent",
                ticketId: result.ticketId,
                emailStatus: result.emailStatus,
                whatsappStatus: result.whatsappStatus,
              }
            : item
        )
      );
    } catch (error) {
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? {
                ...item,
                helpdeskStatus: "idle",
                helpdeskError:
                  error instanceof Error
                    ? error.message
                    : "Unable to send the question to the helpdesk.",
              }
            : item
        )
      );
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] sm:bottom-6 sm:right-6">
      {open && (
        <section
          className="mb-3 flex h-[min(38rem,calc(100vh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          aria-label="Perfect XV Support"
        >
          <header className="flex items-start justify-between border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
            <div>
              <h2 className="font-bold">Perfect XV Support</h2>
              <p className="mt-1 text-xs text-slate-300">Answers from approved help content</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-sm font-semibold text-white hover:bg-white/10"
              aria-label="Close Perfect XV Support"
            >
              Close
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-8 rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-sm text-white"
                    : "mr-5 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800"
                }
              >
                <p className="whitespace-pre-wrap">{message.text}</p>

                {message.options && message.options.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {message.needsChoice ? "Likely matches" : "Related help"}
                    </p>
                    <div className="grid gap-2">
                      {message.options.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => void chooseOption(option, message)}
                          disabled={sending}
                          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs font-semibold text-blue-800 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 border-t border-slate-200 pt-2">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source) => (
                        <a
                          key={source.href}
                          href={source.href}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-blue-700 underline hover:bg-slate-200"
                        >
                          {source.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {message.action && message.role === "assistant" && (
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <a
                      href={message.action.href}
                      onClick={() => setOpen(false)}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                      {message.action.label}
                    </a>
                  </div>
                )}

                {message.role === "assistant" &&
                  message.interactionId &&
                  !message.needsChoice && (
                    <div className="mt-3 border-t border-slate-200 pt-3">
                      {message.feedback === null || message.feedback === undefined ? (
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-slate-600">
                            Was this helpful?
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void sendFeedback(message.id, message.interactionId!, true)
                              }
                              className="rounded-lg border border-lime-300 bg-lime-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-lime-100"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void sendFeedback(message.id, message.interactionId!, false)
                              }
                              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              No — Helpdesk
                            </button>
                          </div>
                        </div>
                      ) : message.feedback ? (
                        <p className="text-xs font-semibold text-slate-500">
                          Thanks for the feedback.
                        </p>
                      ) : message.helpdeskStatus === "sent" ? (
                        <div className="rounded-xl border border-lime-300 bg-lime-50 p-3">
                          <p className="text-sm font-bold text-slate-900">
                            Question sent to the Perfect XV Helpdesk.
                          </p>
                          <p className="mt-1 text-xs text-slate-700">
                            Ticket: {message.ticketId}. A reply will be sent to {message.helpdeskEmail}.
                          </p>
                          {message.emailStatus === "FAILED" ? (
                            <p className="mt-2 text-xs font-semibold text-orange-700">
                              The ticket was recorded, but the automatic helpdesk email reported a delivery error.
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-slate-800">
                            Still need help?
                          </p>
                          <p className="text-xs text-slate-600">
                            Send this question to the Perfect XV Helpdesk. Enter the email address where you want the reply sent.
                          </p>
                          <input
                            type="email"
                            value={message.helpdeskEmail ?? ""}
                            onChange={(event) => updateHelpdeskEmail(message.id, event.target.value)}
                            placeholder="Your reply email address"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            disabled={message.helpdeskStatus === "sending"}
                          />
                          {message.helpdeskError ? (
                            <p className="text-xs font-semibold text-red-700">
                              {message.helpdeskError}
                            </p>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void escalateToHelpdesk(message)}
                            disabled={message.helpdeskStatus === "sending"}
                            className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {message.helpdeskStatus === "sending"
                              ? "Sending to Helpdesk..."
                              : "Send Question to Helpdesk"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            ))}

            {messages.length === 1 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => void ask(question)}
                      className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-lime-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sending && (
              <p className="text-xs font-medium text-slate-500" role="status">
                Interpreting your question and checking approved support material...
              </p>
            )}
          </div>

          <form onSubmit={submit} className="border-t border-slate-200 bg-white p-3">
            <label htmlFor="perfect-xv-support-question" className="sr-only">
              Ask Perfect XV Support
            </label>
            <div className="flex gap-2">
              <input
                id="perfect-xv-support-question"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={600}
                placeholder="Ask about Perfect XV..."
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Support questions, option choices and feedback may be retained without your account identity
              to improve question matching. Helpdesk escalation stores the reply email address you provide. Do
              not enter passwords or payment details.{" "}
              <a href="/legal/privacy" className="font-semibold underline">Privacy</a>
            </p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="ml-auto block rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
        aria-expanded={open}
        aria-label={open ? "Close Perfect XV Support" : "Open Perfect XV Support"}
      >
        {open ? "Close Support" : "Ask Perfect XV"}
      </button>
    </div>
  );
}
