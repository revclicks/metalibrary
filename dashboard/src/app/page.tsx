"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookmarkPlus,
  FolderOpen,
  Users,
  ArrowRight,
  Check,
  Chrome,
} from "lucide-react";
import { useStore } from "@/store";

export default function HomePage() {
  const router = useRouter();
  const token = useStore((s) => s.token);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (token) {
      router.replace("/ads");
    } else {
      setChecking(false);
    }
  }, [token, router]);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-xl font-bold text-indigo-600">
            <BookmarkPlus size={28} />
            <span>Ad Saver</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-indigo-600"
            >
              Log In
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 text-center lg:py-32">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            Save, Organize &{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Analyze
            </span>{" "}
            Meta Ads
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            The ultimate tool for marketers and agencies. Save ads from Meta Ads
            Library, organize them into folders with tags, and gain competitive
            intelligence with powerful analytics.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/register"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/40"
            >
              Get Started Free
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/auth/login"
              className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 transition-colors hover:border-indigo-300 hover:text-indigo-600"
            >
              Log In
            </Link>
          </div>
          <div className="mt-6">
            <Link
              href="/extension"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-indigo-200 bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md"
            >
              <Chrome size={20} />
              Install Chrome Extension
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Free plan includes 50 ads. No credit card required.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Everything you need to track competitor ads
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            From saving individual ads to full competitive analysis, we have you
            covered.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="group rounded-2xl border border-gray-200 p-8 transition-all hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
              <BookmarkPlus size={24} />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-gray-900">
              Save Ads
            </h3>
            <p className="mt-3 leading-relaxed text-gray-600">
              Save any ad from Meta Ads Library with one click using our browser
              extension. Capture creative assets, copy, targeting info, and more.
            </p>
          </div>
          <div className="group rounded-2xl border border-gray-200 p-8 transition-all hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
              <FolderOpen size={24} />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-gray-900">
              Smart Organization
            </h3>
            <p className="mt-3 leading-relaxed text-gray-600">
              Organize ads into nested folders, tag them with custom labels, and
              create smart folders that auto-populate based on rules you define.
            </p>
          </div>
          <div className="group rounded-2xl border border-gray-200 p-8 transition-all hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
              <Users size={24} />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-gray-900">
              Team Collaboration
            </h3>
            <p className="mt-3 leading-relaxed text-gray-600">
              Share folders with your team, leave notes and annotations on ads,
              and collaborate on competitive research in real time.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Start free and upgrade as your needs grow.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Free */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-gray-900">Free</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900">
                  $0
                </span>
                <span className="ml-1 text-gray-500">/month</span>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                Perfect for getting started with ad tracking.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "50 saved ads",
                  "5 folders",
                  "10 tags",
                  "CSV export",
                  "Browser extension",
                ].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-gray-700"
                  >
                    <Check size={16} className="shrink-0 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="mt-8 block rounded-lg border border-gray-300 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:border-indigo-300 hover:text-indigo-600"
              >
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-lg shadow-indigo-100">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900">
                  $19
                </span>
                <span className="ml-1 text-gray-500">/month</span>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                For marketers who need unlimited power.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Unlimited saved ads",
                  "Unlimited folders & tags",
                  "Smart folders",
                  "Advertiser tracking",
                  "Auto-tag rules",
                  "PDF & Sheets export",
                  "Full video previews",
                ].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-gray-700"
                  >
                    <Check size={16} className="shrink-0 text-indigo-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="mt-8 block rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Start Pro Trial
              </Link>
            </div>

            {/* Agency */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <h3 className="text-lg font-semibold text-gray-900">Agency</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900">
                  $49
                </span>
                <span className="ml-1 text-gray-500">/month</span>
              </div>
              <p className="mt-4 text-sm text-gray-600">
                For teams and agencies at scale.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Everything in Pro",
                  "Up to 10 team members",
                  "Shared team folders",
                  "API access",
                  "Webhooks",
                  "Priority support",
                  "Custom integrations",
                ].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-gray-700"
                  >
                    <Check size={16} className="shrink-0 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="mt-8 block rounded-lg border border-gray-300 py-2.5 text-center text-sm font-semibold text-gray-700 transition-colors hover:border-indigo-300 hover:text-indigo-600"
              >
                Start Agency Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2 text-lg font-bold text-indigo-600">
            <BookmarkPlus size={22} />
            <span>Ad Saver</span>
          </div>
          <p className="mt-4">
            Save, organize, and analyze Meta Ads Library data.
          </p>
          <p className="mt-2">
            &copy; {new Date().getFullYear()} Ad Saver. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
