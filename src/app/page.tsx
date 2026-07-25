"use client";

export default function HomePage() {
  return (
    <main style={{ padding: "20px" }}>
      <h1>Six Nations Predictor</h1>

      <p>
        <button onClick={() => window.location.href = "/register"}>
          Register
        </button>
      </p>

      <p>
        <button onClick={() => window.location.href = "/login"}>
          Login
        </button>
      </p>

      <p>
        <button onClick={() => window.location.href = "/dashboard"}>
          Dashboard
        </button>
      </p>

      <p>
        <button onClick={() => window.location.href = "/predictions"}>
          Predictions
        </button>
      </p>

      <p>
        <button onClick={() => window.location.href = "/leaderboard"}>
          Leaderboard
        </button>
      </p>

      <p>
        <button onClick={() => window.location.href = "/admin"}>
          Admin
        </button>
      </p>
    </main>
  );
}