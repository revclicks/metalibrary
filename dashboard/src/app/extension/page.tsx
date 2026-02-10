"use client";

import Link from "next/link";
import { BookmarkPlus, Chrome, Download, ArrowLeft } from "lucide-react";

export default function ExtensionPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
            <BookmarkPlus size={28} />
            <span>Ad Saver</span>
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
          <Chrome size={40} />
        </div>
        <h1 className="mt-8 text-4xl font-extrabold text-gray-900">
          Install the Chrome Extension
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Save ads directly from the Meta Ads Library with one click.
        </p>

        <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-left">
          <h2 className="text-xl font-bold text-gray-900">Manual Installation</h2>
          <p className="mt-2 text-sm text-gray-600">
            The extension is not yet on the Chrome Web Store. Follow these steps to install it manually:
          </p>
          <ol className="mt-6 space-y-4 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">1</span>
              <span>Download the extension ZIP file from the link below and unzip it.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">2</span>
              <span>Open Chrome and navigate to <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">chrome://extensions</code></span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">3</span>
              <span>Enable <strong>Developer mode</strong> using the toggle in the top-right corner.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">4</span>
              <span>Click <strong>Load unpacked</strong> and select the unzipped extension folder.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">5</span>
              <span>Visit the <a href="https://www.facebook.com/ads/library" target="_blank" className="text-indigo-600 underline">Meta Ads Library</a> and start saving ads!</span>
            </li>
          </ol>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="https://github.com/nickg-24/MALT/releases"
            target="_blank"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700"
          >
            <Download size={18} />
            Download Extension
          </a>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 transition-colors hover:border-indigo-300 hover:text-indigo-600"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
