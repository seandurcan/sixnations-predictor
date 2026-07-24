export default function AdminPage() {
  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold">
        Admin Dashboard
      </h1>

      <div className="mt-6 grid gap-4 md:grid-cols-4">

        <div className="border rounded p-4">
          <h2>Users</h2>
          <p>0</p>
        </div>

        <div className="border rounded p-4">
          <h2>Paid Users</h2>
          <p>0</p>
        </div>

        <div className="border rounded p-4">
          <h2>Predictions</h2>
          <p>0</p>
        </div>

        <div className="border rounded p-4">
          <h2>Matches</h2>
          <p>15</p>
        </div>

      </div>
    </main>
  );
}