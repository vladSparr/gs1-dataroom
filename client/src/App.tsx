import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

export default function App() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    fetch(`${API}/health`)
      .then((r) => r.json())
      .then((d) => setStatus(JSON.stringify(d)))
      .catch((e) => setStatus(`Error: ${e.message}`));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="rounded-lg border bg-white px-6 py-4 font-mono text-sm">
        {status}
      </div>
    </div>
  );
}
