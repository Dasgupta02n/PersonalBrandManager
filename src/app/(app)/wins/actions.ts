"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/data/session";

export async function deleteWin(formData: FormData) {
  const { db, user } = await requireUser();
  const id = z.uuid().safeParse(formData.get("winId"));
  if (!id.success) return;
  await db.from("wins").delete().eq("id", id.data).eq("user_id", user.id);
  revalidatePath("/wins");
  revalidatePath("/today");
}
