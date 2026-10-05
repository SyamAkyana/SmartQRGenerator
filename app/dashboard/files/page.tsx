import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { listFiles, countFiles } from "@/lib/file/service";
import { FilesList } from "./components/files-list";
import type { StoredFileRecord } from "@/lib/file/service";

export default async function FilesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [files, total] = await Promise.all([
    listFiles(userId),
    countFiles(userId),
  ]);

  return <FilesList initialFiles={files} totalCount={total} />;
}