import styles from "./ExpandableCard.module.css";

export default function Chevron({ open }: { open: boolean }) {
  return <span className={open ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron}>▸</span>;
}
