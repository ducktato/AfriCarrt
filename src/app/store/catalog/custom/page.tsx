import { CustomItemForm } from "./CustomItemForm";

export default function CustomItemPage() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:px-6">
      <h1 className="font-display text-xl font-semibold text-ink">Add a custom item</h1>
      <p className="mt-1 text-sm text-ink/60">
        Not in the shared catalog? List it yourself. We&apos;ll check for close matches first.
      </p>
      <div className="mt-6 rounded-2xl border border-sand bg-white p-6 shadow-sm">
        <CustomItemForm />
      </div>
    </div>
  );
}
