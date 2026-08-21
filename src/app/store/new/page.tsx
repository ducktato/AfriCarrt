import { StoreForm } from "./StoreForm";

export default function NewStorePage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <h1 className="font-display text-xl font-semibold text-ink">Set up your store</h1>
      <p className="mt-1 text-sm text-ink/60">
        You&apos;ll be able to add products from the shared catalog or list your own once this is created.
      </p>
      <div className="mt-6 rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <StoreForm />
      </div>
    </div>
  );
}
