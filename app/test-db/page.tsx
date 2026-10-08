import { createClient } from "../../lib/supabase/server";

export default async function TestDatabasePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("datasets")
    .select("*");

  if (error) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-3xl font-bold text-red-400">
          Database Connection Failed
        </h1>

        <pre className="mt-6 rounded-xl bg-white/5 p-5 text-sm text-red-300">
          {error.message}
        </pre>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-10 text-white">
      <h1 className="text-3xl font-bold text-[#0A84FF]">
        Supabase Connected ✅
      </h1>

      <p className="mt-4 text-white/50">
        Datasets retrieved from the database:
      </p>

      <pre className="mt-8 overflow-auto rounded-xl bg-white/5 p-5 text-sm">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}