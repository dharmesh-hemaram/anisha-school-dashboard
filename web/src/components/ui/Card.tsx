import type { HTMLAttributes } from "react";
import styles from "./Card.module.css";

type CardProps = HTMLAttributes<HTMLDivElement>;

/** The shared "surface + border + shadow" card look used across the app. */
export default function Card({ className, ...rest }: CardProps) {
  return <div className={className ? `${styles.card} ${className}` : styles.card} {...rest} />;
}
