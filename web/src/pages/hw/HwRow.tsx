import type { HwTask } from "../../types";
import { useAppDispatch } from "../../app/hooks";
import { toggleDone } from "../../features/hw/hwSlice";
import { Item, ItemContent, ItemDescription, ItemMedia } from "../../components/ui/item";
import SubjectBadge from "../../components/subjects/SubjectBadge";

const DONE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" />
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.3l2.5 2.5L16 9" />
  </svg>
);
const TODO_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export default function HwRow({ task, done }: { task: HwTask; done: boolean }) {
  const dispatch = useAppDispatch();
  return (
    <Item variant="outline" size="xs" className={done ? "cursor-pointer opacity-55" : "cursor-pointer"} onClick={() => dispatch(toggleDone(task.id))}>
      <ItemMedia variant="icon">{done ? DONE_ICON : TODO_ICON}</ItemMedia>
      <ItemContent>
        {task.subject && <SubjectBadge subject={task.subject} />}
        <ItemDescription className={done ? "line-through" : undefined}>{task.text}</ItemDescription>
      </ItemContent>
    </Item>
  );
}
