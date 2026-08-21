export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="text-center">
      <h1 className="mb-2 font-display text-lg font-semibold text-ink">
        Confirm your email
      </h1>
      <p className="text-sm text-ink/60">
        We sent a confirmation link to{" "}
        <span className="font-medium text-ink">{email ?? "your email"}</span>.
        Click it to finish setting up your account.
      </p>
    </div>
  );
}
