import type { PictureItem } from "../../../../revision-notebooks/types";
import { resolveImage } from "../../../../revision-notebooks/resolveImage";
import SourceMarks from "../../SourceMarks";
import styles from "../../RevisionNotebookPage.module.css";

export default function PictureItemCard({ item }: { item: PictureItem }) {
  return (
    <div className={styles.picItem}>
      <img src={resolveImage(item.image)} alt="" />
      <div className={styles.picCaption}>
        {item.caption}
        <SourceMarks sources={item.sources} />
      </div>
    </div>
  );
}
