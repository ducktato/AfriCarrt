import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-sand px-4 py-6 text-center text-xs text-ink/50 sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <span>&copy; {new Date().getFullYear()} AfriCarrt</span>
        <Link href="/terms" className="hover:text-ink hover:underline">
          Terms of Service
        </Link>
        <Link href="/privacy" className="hover:text-ink hover:underline">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
