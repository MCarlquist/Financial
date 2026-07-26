import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export async function saveUploadedFile(file: File) {
  const uploadDir = path.join(process.cwd(), "uploads");

  await mkdir(uploadDir, {
    recursive: true,
  });

  const extension = path.extname(file.name);

  const filename =
    `${crypto.randomUUID()}${extension}`;

  const filepath =
    path.join(uploadDir, filename);

  const bytes = await file.arrayBuffer();

  await writeFile(filepath, Buffer.from(bytes));

  return {
    filename,
    filepath,
  };
}
