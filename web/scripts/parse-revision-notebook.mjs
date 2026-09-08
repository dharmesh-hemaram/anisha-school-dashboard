#!/usr/bin/env node
// One-off migration script, kept as a worked reference: this is how
// social-studies-half-yearly.json was produced from a legacy static HTML
// page (since deleted, so this specific script can no longer be re-run) --
// parsed into the discriminated-union data shape defined in
// src/revision-notebooks/types.ts instead of hand-retranscribed
// (~150+ Q&A entries -- error-prone to eyeball).
//
// A *new* subject's notebook doesn't need this script at all: it's just a
// new docs/revision-notebooks/<slug>.json file hand-authored (or generated
// by a similar one-off parser, if migrating another legacy HTML page) in
// the same RevisionNotebook shape -- the app fetches it by slug at runtime,
// no code change needed. See src/features/revision/revisionSlice.ts.
//
// Usage (historical): node scripts/parse-revision-notebook.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(__dirname, "../../docs/revision-notebooks/social-studies-half-yearly.html");
const OUTPUT = path.join(__dirname, "../../docs/revision-notebooks/social-studies-half-yearly.json");

const html = readFileSync(SOURCE, "utf8");
const $ = cheerio.load(html);

function collapseWs(s) {
  // Collapses runs of plain whitespace to one space but leaves
  // (&nbsp;) alone, since the source uses double-nbsp as a deliberate
  // visual gap between MCQ options.
  return s.replace(/[ \t\r\n]+/g, " ").trim();
}

function parseSources($el) {
  const rev = $el.find(".src-rev").length > 0;
  const ws = $el.find(".src-ws").length > 0;
  if (!rev && !ws) return undefined;
  const marks = {};
  if (rev) marks.revisionSheet = true;
  if (ws) marks.worksheet = true;
  return marks;
}

function withoutSources($el) {
  const clone = $el.clone();
  clone.find(".src-rev,.src-ws").remove();
  return clone;
}

// ---- Category 1: Fill in the Blanks ----
function parseFibGroup($group) {
  const sets = [];
  let pendingNote;
  $group.children().each((_, el) => {
    const $el = $(el);
    if ($el.is("p.answer-line")) {
      pendingNote = collapseWs($el.text());
    } else if ($el.is("ol")) {
      const items = [];
      $el.children("li").each((_, li) => {
        const $li = $(li);
        const sources = parseSources($li);
        const answers = $li
          .find(".fib-answer")
          .map((_, a) => collapseWs($(a).text()))
          .get();
        const $clone = withoutSources($li);
        $clone.find(".fib-answer").remove();
        $clone.find(".fib-blank").replaceWith("___");
        const template = collapseWs($clone.text());
        items.push({ template, answers, ...(sources ? { sources } : {}) });
      });
      sets.push({ ...(pendingNote ? { note: pendingNote } : {}), items });
      pendingNote = undefined;
    }
  });
  return sets;
}

// ---- Category 2: Match the Following ----
function parseMatchGroup($group) {
  const sets = [];
  let pendingLabel;
  let pendingSources;
  const children = $group.children().toArray();
  for (let i = 0; i < children.length; i++) {
    const $el = $(children[i]);
    if ($el.is("h4.setlabel")) {
      pendingSources = parseSources($el);
      pendingLabel = collapseWs(withoutSources($el).text());
    } else if ($el.is("table")) {
      const trs = $el.find("tr").toArray();
      const columns = $(trs[0])
        .find("th")
        .map((_, th) => collapseWs($(th).text()))
        .get();
      const pairs = trs.slice(1).map((tr) => {
        const tds = $(tr).find("td").toArray();
        const cell = (td) => {
          const $td = $(td);
          const svg = $td.find("svg");
          if (svg.length) return { text: "", svg: $.html(svg) };
          return { text: collapseWs($td.text()) };
        };
        const left = cell(tds[0]);
        const right = cell(tds[1]);
        return { left: left.text, right: right.text, ...(left.svg ? { leftSvg: left.svg } : {}) };
      });
      let answerLine;
      const next = children[i + 1] ? $(children[i + 1]) : null;
      if (next && next.is("p.answer-line")) {
        answerLine = collapseWs(next.text()).replace(/^Answer:\s*/, "");
        i++;
      }
      sets.push({
        ...(pendingLabel ? { label: pendingLabel } : {}),
        ...(pendingSources ? { sources: pendingSources } : {}),
        columns,
        pairs,
        ...(answerLine ? { answerLine } : {}),
      });
      pendingLabel = undefined;
      pendingSources = undefined;
    }
  }
  return sets;
}

// ---- Category 3: True or False ----
function parseTrueFalseGroup($group) {
  const items = [];
  $group.children("ol").children("li").each((_, li) => {
    const $li = $(li);
    const strong = $li.find("strong").first();
    const answer = collapseWs(strong.text()).toLowerCase() === "true";
    const full = $li.text();
    const arrowIdx = full.indexOf("→");
    const statement = collapseWs(arrowIdx >= 0 ? full.slice(0, arrowIdx) : full);
    const afterArrow = arrowIdx >= 0 ? full.slice(arrowIdx + 1) : "";
    const dashIdx = afterArrow.indexOf("—");
    const explanation = dashIdx >= 0 ? collapseWs(afterArrow.slice(dashIdx + 1)) : undefined;
    items.push({ statement, answer, ...(explanation ? { explanation } : {}) });
  });
  return items;
}

// ---- Category 4: Name the Following / One Word ----
function parseNameGroup($group) {
  const items = [];
  $group.children("ul").children("li").each((_, li) => {
    const $li = $(li);
    const sources = parseSources($li);
    const answer = collapseWs($li.find("strong").first().text());
    const fullText = withoutSources($li).text();
    const dashIdx = fullText.lastIndexOf("—");
    const prompt = collapseWs(dashIdx >= 0 ? fullText.slice(0, dashIdx) : fullText);
    items.push({ prompt, answer, ...(sources ? { sources } : {}) });
  });
  return items;
}

// ---- Categories 5/7/8/9: Define / Short Answer / Long Answer / Application Based ----
function parseQaGroup($group) {
  const items = [];
  $group.children(".qa").each((_, qa) => {
    const $qa = $(qa);
    const $q = $qa.children(".q").first();
    const sources = parseSources($q);
    const $leaderImg = $q.find("img.leader-thumb").first();
    const questionLeaderImage = $leaderImg.length ? $leaderImg.attr("src").replace(/^leaders\//, "") : undefined;
    const $qClone = withoutSources($q);
    $qClone.find("img.leader-thumb").remove();
    const question = collapseWs($qClone.text());

    const $a = $qa.children(".a").first();
    const $ul = $a.children("ul");
    const answer = $ul.length
      ? $ul.children("li").map((_, li) => collapseWs($(li).text())).get()
      : collapseWs($a.text());

    items.push({
      question,
      ...(questionLeaderImage ? { questionLeaderImage } : {}),
      answer,
      ...(sources ? { sources } : {}),
    });
  });
  return items;
}

// ---- Category 6: State / UT Capitals ----
function parseCapitalsGroup($group) {
  const rows = [];
  const $table = $group.children("table").first();
  const trs = $table.find("tr").toArray();
  trs.slice(1).forEach((tr) => {
    const tds = $(tr).find("td").toArray();
    const state = collapseWs($(tds[0]).text());
    const capital = collapseWs($(tds[1]).text());
    const sources = tds[2] ? parseSources($(tds[2])) : undefined;
    rows.push({ state, capital, ...(sources ? { sources } : {}) });
  });
  return rows;
}

// ---- Category 10: MCQ Practice ----
function parseMcqGroup($group) {
  const items = [];
  $group.children(".mcq").each((_, mcq) => {
    const $mcq = $(mcq);
    const question = collapseWs($mcq.children(".q").first().text());
    const options = collapseWs($mcq.children(".opts").first().text());
    const answer = collapseWs($mcq.children(".ans").first().text()).replace(/^Answer:\s*/, "");
    items.push({ question, options, answer });
  });
  return items;
}

// ---- Category 11: Picture Study ----
function pictureCaptionText($cap) {
  const $clone = withoutSources($cap);
  const $ps = $clone.children("p");
  if ($ps.length) {
    return $ps.map((_, p) => collapseWs($(p).text())).get().join("\n");
  }
  return collapseWs($clone.text());
}
function parsePictureGroup($group) {
  const items = [];
  $group.children(".pic-item").each((_, item) => {
    const $item = $(item);
    const image = $item.find("img").first().attr("src");
    const $cap = $item.children(".pic-caption").first();
    const sources = parseSources($cap);
    const caption = pictureCaptionText($cap);
    items.push({ image, caption, ...(sources ? { sources } : {}) });
  });

  let leaderGrid;
  const $grid = $group.children(".leader-grid").first();
  if ($grid.length) {
    const $h4 = $group.children("h4.setlabel").first();
    const gridItems = $grid
      .find("figure")
      .map((_, fig) => {
        const $fig = $(fig);
        return {
          image: $fig.find("img").attr("src"),
          caption: collapseWs($fig.find("figcaption").text()),
        };
      })
      .get();
    leaderGrid = { label: $h4.length ? collapseWs($h4.text()) : "", items: gridItems };
  }
  return { items, ...(leaderGrid ? { leaderGrid } : {}) };
}

const CATEGORY_SPECS = [
  { title: "Fill in the Blanks", type: "fib", groupKey: "sets", parse: parseFibGroup },
  { title: "Match the Following", type: "match", groupKey: "sets", parse: parseMatchGroup },
  { title: "True or False", type: "trueFalse", groupKey: "items", parse: parseTrueFalseGroup },
  { title: "Name the Following / One Word", type: "name", groupKey: "items", parse: parseNameGroup },
  { title: "Define", type: "qa", groupKey: "items", parse: parseQaGroup },
  { title: "State / UT Capitals", type: "capitals", groupKey: "rows", parse: parseCapitalsGroup },
  { title: "Write Short Answers", type: "qa", groupKey: "items", parse: parseQaGroup },
  { title: "Long Answers", type: "qa", groupKey: "items", parse: parseQaGroup },
  { title: "Application Based", type: "qa", groupKey: "items", parse: parseQaGroup },
  { title: "MCQ Practice", type: "mcq", groupKey: "items", parse: parseMcqGroup },
  { title: "Picture Study", type: "picture", groupKey: null, parse: parsePictureGroup },
];

const chapters = $(".filter-chip[data-chapter]")
  .toArray()
  .map((el) => ({ id: $(el).attr("data-chapter"), label: collapseWs($(el).text()) }))
  .filter((c) => c.id !== "all");

const $pageTitle = $(".page-title").first();
const subjectBadge = collapseWs($pageTitle.find(".subject-badge").text());
const title = collapseWs($pageTitle.clone().children(".subject-badge").remove().end().text());
const subtitle = collapseWs($(".page-sub").first().text());
const examMeta = collapseWs($(".page-meta").first().text());

const $footer = $("footer.page-footer").clone();
$footer.find("br").replaceWith("\n");
const footerNote = $footer
  .text()
  .split("\n")
  .map((s) => collapseWs(s))
  .filter(Boolean)
  .join("\n");

const $catItems = $(".cat-item").toArray();
const sourceCounts = [];
const categories = $catItems.map((catEl, i) => {
  const $cat = $(catEl);
  const num = i + 1;
  const spec = CATEGORY_SPECS[i];
  const docTitle = collapseWs($cat.find(".cat-title-text").first().text());
  if (docTitle !== spec.title) {
    throw new Error(`Category ${num} title mismatch: doc has "${docTitle}", script expected "${spec.title}"`);
  }
  const $catBody = $cat.children(".cat-body").first();
  const note = collapseWs($catBody.children("p.cat-note").first().text()) || undefined;

  const groups = $catBody
    .children(".chap-group")
    .toArray()
    .map((groupEl) => {
      const $group = $(groupEl);
      const chapter = $group.attr("data-chapter");
      const parsed = spec.parse($group);
      return spec.groupKey === null ? { chapter, ...parsed } : { chapter, [spec.groupKey]: parsed };
    });

  sourceCounts.push({ num, title: spec.title, chapGroups: $catBody.children(".chap-group").length });

  return { num, title: spec.title, ...(note ? { note } : {}), data: { type: spec.type, groups } };
});

const notebook = {
  slug: "social-studies-half-yearly",
  subjectBadge,
  title,
  subtitle,
  examMeta,
  chapters,
  categories,
  footerNote,
};

// ---- Sanity check: element counts per category, source vs. parsed ----
console.log("Parsed category summary (verify against the source HTML):");
categories.forEach((cat) => {
  const groups = cat.data.groups;
  const itemCount = groups.reduce((sum, g) => {
    if ("items" in g) return sum + g.items.length;
    if ("rows" in g) return sum + g.rows.length;
    if ("sets" in g) return sum + g.sets.reduce((s2, set) => s2 + (set.items?.length ?? set.pairs?.length ?? 0), 0);
    return sum;
  }, 0);
  console.log(`  ${cat.num}. ${cat.title}: ${groups.length} chapter group(s), ${itemCount} item(s)`);
});

writeFileSync(OUTPUT, JSON.stringify(notebook, null, 2) + "\n");

console.log(`\nWrote ${OUTPUT}`);
