import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveImage } from "../../revision-notebooks/resolveImage";
import styles from "./Markdown.module.css";

// Notebook question/answer/caption text goes through this instead of being
// printed raw, so a source that needs a bit of **emphasis**, a table, or an
// inline `![](science/x.jpg)` diagram doesn't need a new JSON field and a
// matching type/component change every time -- see QaItem.image, added and
// then made redundant by this. `p` renders as a span (not a real <p>)
// because callers already wrap this in their own <p>/<li>; a nested <p>
// would be invalid HTML.
export default function Markdown({ text }: { text: string }) {
  return (
    <span className={styles.md}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <span className={styles.para}>{children}</span>,
          img: ({ src, alt }) => (
            <a href={resolveImage(String(src ?? ""))} target="_blank" rel="noreferrer">
              <img src={resolveImage(String(src ?? ""))} alt={alt ?? ""} />
            </a>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </span>
  );
}
