import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div>
      <h1 className="mb-6 text-center font-display text-xl font-semibold text-ink">
        Log in to AfriCarrt
      </h1>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <LoginForm next={next} />
    </div>
  );
}
