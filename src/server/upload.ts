import { createServerFn } from "@tanstack/react-start";
import { saveUploadedFile } from "@/lib/file";

export const uploadImage = createServerFn({
  method: "POST",
})
.handler(async ({ data }) => {
  const formData = data as unknown as FormData;

  const file = formData.get("image");

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
