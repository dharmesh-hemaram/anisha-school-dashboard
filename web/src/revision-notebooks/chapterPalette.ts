// A notebook's chapters get their accent color by position, cycling through
// this palette -- no per-subject CSS selectors to add when a new notebook
// (with its own chapter ids) ships. Order matters: it reproduces the exact
// colors the Social Studies notebook already shipped with (gov/delhi/
// leaders/transport were hindi/marathi/sst/maths), so generalizing this
// didn't change that page's look.
export const CHAPTER_PALETTE = [
  ["--subj-hindi", "--subj-hindi-bg"],
  ["--subj-marathi", "--subj-marathi-bg"],
  ["--subj-sst", "--subj-sst-bg"],
  ["--subj-maths", "--subj-maths-bg"],
  ["--subj-science", "--subj-science-bg"],
  ["--subj-english", "--subj-english-bg"],
  ["--subj-cs", "--subj-cs-bg"],
  ["--subj-evs", "--subj-evs-bg"],
  ["--subj-robotics", "--subj-robotics-bg"],
  ["--subj-gk", "--subj-gk-bg"],
] as const;

export function chapterAccentVars(index: number): { "--chap-accent": string; "--chap-accent-bg": string } {
  const [accent, bg] = CHAPTER_PALETTE[((index % CHAPTER_PALETTE.length) + CHAPTER_PALETTE.length) % CHAPTER_PALETTE.length];
  return { "--chap-accent": `var(${accent})`, "--chap-accent-bg": `var(${bg})` };
}
