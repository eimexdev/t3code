/** Visual identity tokens for a generated project badge. */
export interface ProjectIdentity {
  readonly monogram: string;
  readonly color: string;
}

function normalizeProjectName(projectName: string): string {
  return projectName.normalize("NFKC").trim();
}

function projectMonogram(projectName: string): string {
  const words = normalizeProjectName(projectName).match(/[\p{L}\p{N}]+/gu) ?? [];
  const firstWord = words[0];
  if (!firstWord) return "PR";

  const glyphs = Array.from(firstWord);
  const first = glyphs[0] ?? "P";
  const second =
    glyphs.slice(1).find((glyph) => /\p{N}/u.test(glyph)) ??
    (words.length > 1 ? Array.from(words.at(-1) ?? "")[0] : glyphs.at(-1)) ??
    first;
  return Array.from(`${first}${second}`.toUpperCase()).slice(0, 2).join("");
}

function projectHue(projectName: string): number {
  const seed = normalizeProjectName(projectName).toLocaleLowerCase("en-US") || "project";
  let hue = 0;
  for (const glyph of seed) {
    hue = (hue * 31 + (glyph.codePointAt(0) ?? 0)) % 360;
  }
  return hue;
}

/** Derives the stable monogram and generated colors used when a project has no icon. */
export function deriveProjectIdentity(projectName: string): ProjectIdentity {
  const hue = projectHue(projectName);
  return {
    monogram: projectMonogram(projectName),
    color: `light-dark(hsl(${hue} 65% 35%), hsl(${hue} 65% 70%))`,
  };
}
