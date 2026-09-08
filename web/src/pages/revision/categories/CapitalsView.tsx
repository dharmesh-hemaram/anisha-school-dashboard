import type { CapitalsCategory, Chapter } from "../../../revision-notebooks/types";
import ChapterGroup from "../ChapterGroup";
import CapitalRowItem from "./items/CapitalRowItem";
import styles from "../RevisionNotebookPage.module.css";

export default function CapitalsView({ groups, chapters }: { groups: CapitalsCategory["groups"]; chapters: Chapter[] }) {
  return (
    <>
      {groups.map((g) => (
        <ChapterGroup key={g.chapter} chapter={g.chapter} chapters={chapters}>
          <table className={styles.table}>
            <tbody>
              <tr>
                <th>State / UT</th>
                <th>Capital</th>
                <th>Source</th>
              </tr>
              {g.rows.map((row, i) => (
                <CapitalRowItem key={i} row={row} />
              ))}
            </tbody>
          </table>
        </ChapterGroup>
      ))}
    </>
  );
}
