import styles from "./Count.module.css";

/** The small rounded-pill item count -- used next to a subject/type/cycle
 * heading wherever a group of items is collapsed under one label. */
export default function Count({ n }: { n: number }) {
  return <span className={styles.count}>{n}</span>;
}
