export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold">
          Six Nations Predictor
        </h1>

        <p className="mt-4">
          Predict all 15 matches.
        </p>

        <button className="mt-6 rounded bg-green-600 px-4 py-2 text-white">
          Register
        </button>
      </div>
    </main>
  );
}