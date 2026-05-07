/**
 * Server-side utilities for reading OOgle seed files at request time.
 * Files live in public/docs/ — edit them without any code changes.
 * Format: plain text, one entry per line, UTF-8, LF endings.
 */
import fs from "fs";
import path from "path";

function readLines(filename: string): string[] {
  const filePath = path.join(process.cwd(), "public", "docs", filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function readButtonTexts(): string[] {
  return readLines("oogle-button-texts.txt");
}

export function readMysteryDestinations(): string[] {
  return readLines("mystery-destinations.txt");
}

export function pickRandom<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}
