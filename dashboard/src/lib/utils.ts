import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export type AdFormat = "image" | "video" | "carousel" | "collection";
export type AdStatus = "active" | "inactive";
export type PlanTier = "free" | "pro" | "agency";
export type UserRole = "admin" | "editor" | "viewer";

export const AD_FORMATS = ["image", "video", "carousel", "collection"];
export const AD_STATUSES = ["active", "inactive"];
export const PLATFORMS = ["facebook", "instagram", "messenger", "audience_network"];
export const CTA_TYPES = ["LEARN_MORE", "SHOP_NOW", "SIGN_UP", "DOWNLOAD", "GET_OFFER", "CONTACT_US", "BOOK_NOW", "WATCH_MORE"];
