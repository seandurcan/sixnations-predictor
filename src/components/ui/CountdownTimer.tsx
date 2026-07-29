"use client";

import { useEffect, useState } from "react";

type CountdownTimerProps = {
  targetDate: string | Date;
  label?: string;
};

type TimeRemaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function calculateTimeRemaining(
  targetDate: string | Date
): TimeRemaining {
  const target =
    new Date(targetDate).getTime();

  const now =
    new Date().getTime();

  const difference =
    target - now;

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    };
  }

  return {
    days: Math.floor(
      difference /
        (1000 * 60 * 60 * 24)
    ),
    hours: Math.floor(
      (difference /
        (1000 * 60 * 60)) %
        24
    ),
    minutes: Math.floor(
      (difference /
        (1000 * 60)) %
        60
    ),
    seconds: Math.floor(
      (difference / 1000) %
        60
    ),
    expired: false,
  };
}

function formatNumber(value: number) {
  return value
    .toString()
    .padStart(2, "0");
}

export default function CountdownTimer({
  targetDate,
  label = "Kick-off countdown",
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] =
    useState<TimeRemaining>(() =>
      calculateTimeRemaining(targetDate)
    );

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        setTimeRemaining(
          calculateTimeRemaining(
            targetDate
          )
        );
      }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [targetDate]);

  if (timeRemaining.expired) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-semibold text-green-700">
          {label}
        </p>

        <p className="mt-1 text-lg font-bold text-green-800">
          Kick-off has started
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-600">
        {label}
      </p>

      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <div className="rounded bg-white p-2 shadow-sm">
          <div className="text-2xl font-bold text-slate-900">
            {timeRemaining.days}
          </div>

          <div className="text-xs text-slate-500">
            Days
          </div>
        </div>

        <div className="rounded bg-white p-2 shadow-sm">
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(
              timeRemaining.hours
            )}
          </div>

          <div className="text-xs text-slate-500">
            Hours
          </div>
        </div>

        <div className="rounded bg-white p-2 shadow-sm">
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(
              timeRemaining.minutes
            )}
          </div>

          <div className="text-xs text-slate-500">
            Mins
          </div>
        </div>

        <div className="rounded bg-white p-2 shadow-sm">
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(
              timeRemaining.seconds
            )}
          </div>

          <div className="text-xs text-slate-500">
            Secs
          </div>
        </div>
      </div>
    </div>
  );
}