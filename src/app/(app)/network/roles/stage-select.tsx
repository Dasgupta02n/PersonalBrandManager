"use client";

import { useRef } from "react";
import { ROLE_STAGE_LABEL, ROLE_STAGES, type RoleStage } from "@/lib/network/taxonomy";

/** Changes a role's stage as soon as a new one is picked. */
export function StageSelect({ id, stage, action }: { id: string; stage: RoleStage; action: (form: FormData) => Promise<void> }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={action}>
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`stage-${id}`}>
        Stage
      </label>
      <select
        id={`stage-${id}`}
        name="stage"
        defaultValue={stage}
        onChange={() => ref.current?.requestSubmit()}
        className="min-h-11 rounded-lg border border-border-soft bg-background px-2.5 text-sm font-medium focus:outline-2 focus:outline-offset-2 focus:outline-accent"
      >
        {ROLE_STAGES.map((s) => (
          <option key={s} value={s}>
            {ROLE_STAGE_LABEL[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
