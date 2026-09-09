import styles from "./TableOfContents.module.css";

interface TableOfContentsProps {
  categories: { num: number; title: string }[];
}

/** Jump-to-section links for the notebook's currently visible categories
 * (already filtered by chapter/search -- an empty section isn't worth a
 * link). Rendered twice: `sidebar` sits in the wide-viewport margin next to
 * the notebook and stays open, `mobile` is a closed-by-default <details> so
 * it doesn't eat vertical space on a phone. Both point at the same
 * `#cat-N` anchors CategorySection already sets. */
export default function TableOfContents({ categories }: TableOfContentsProps) {
  if (categories.length === 0) return null;

  const links = (
    <ul className={styles.list}>
      {categories.map((c) => (
        <li key={c.num}>
          <a href={`#cat-${c.num}`}>
            <span className={styles.num}>{c.num}</span>
            {c.title}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <nav className={styles.sidebar} aria-label="Jump to section">
        <p className={styles.sidebarLabel}>Jump to section</p>
        {links}
      </nav>
      <details className={styles.mobile}>
        <summary>Jump to section</summary>
        {links}
      </details>
    </>
  );
}
