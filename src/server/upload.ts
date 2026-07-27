import { createServerFn } from "@tanstack/react-start";
import { saveUploadedFile } from "@/lib/file";

export const uploadImage = createServerFn({
  method: "POST",
})
.validator((data: FormData) => data)
.handler(async ({ data }) => {
    const file = data.get("image");

  if (!(file instanceof File)) {
    throw new Error("No image uploaded");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid image");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image too large");
  }

  const saved = await saveUploadedFile(file);

  return saved;
});
