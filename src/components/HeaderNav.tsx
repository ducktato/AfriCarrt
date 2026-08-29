"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/lib/auth-actions";
import { CartLink } from "@/components/CartLink";

export function HeaderNav({
  isLoggedIn,
  accountHref,
}: {
  isLoggedIn: boolean;
  accountHref: string;
}) {
  const [open, setOpen] = useState(false);

  const links = (
    <>
      <Link
        href="/stores"
        onClick={() => setOpen(false)}
        className="font-medium text-parchment/80 transition hover:text-parchment"
      >
        Stores
      </Link>
      <Link
        href="/browse"
        onClick={() => setOpen(false)}
        className="font-medium text-parchment/80 transition hover:text-parchment"
      >
        Browse
      </Link>
      <CartLink />
      {isLoggedIn ? (
        <>
          <Link
            href={accountHref}
            onClick={() => setOpen(false)}
            className="font-medium text-parchment/80 transition hover:text-parchment"
          >
            My account
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-parchment/30 px-3.5 py-1.5 font-medium text-parchment/90 transition hover:border-parchment/60 hover:text-parchment"
            >
              Sign out
            </button>
          </form>
        </>
      ) : (
        <>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="font-medium text-parchment/80 transition hover:text-parchment"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            onClick={() => setOpen(false)}
            className="rounded-full bg-terracotta px-4 py-1.5 font-medium text-parchment transition hover:bg-terracotta/90"
          >
            Sign up
          </Link>
        </>
      )}
    </>
  );

  return (
    <>
      <nav className="hidden items-center gap-5 text-sm sm:flex">{links}</nav>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full text-parchment sm:hidden"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>
      {open && (
        <nav className="absolute top-16 right-0 left-0 flex flex-col gap-4 border-t border-parchment/10 bg-ink px-4 py-5 text-sm sm:hidden">
          {links}
        </nav>
      )}
    </>
  );
}
