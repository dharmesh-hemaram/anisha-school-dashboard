import { IMAGE_ATTACHMENT_RE } from "../../lib/constants";
import styles from "./AttachmentLink.module.css";

interface AttachmentLinkProps {
  url: string | null | undefined;
  label?: string;
}

// A photo attachment (a seek-kit materials list, a Facebook-recap photo) is
// more useful shown inline than as a bare "View attachment" link -- a PDF
// (worksheet, portion sheet) still needs the link since it can't render
// inline anyway.
export default function AttachmentLink({ url, label = "View attachment →" }: AttachmentLinkProps) {
  if (!url) return null;
  if (IMAGE_ATTACHMENT_RE.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <img className={styles.image} src={url} loading="lazy" alt="" />
      </a>
    );
  }
  return (
    <a className={styles.link} href={url} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}
