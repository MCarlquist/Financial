import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient(process.env.HF_TOKEN);



export async function ai() {
    return {
        describeReceipt: async (image: string) => {
            const chatCompletion = await client.chatCompletion({
                model: "typhoon-ai/typhoon-ocr1.5-2b:featherless-ai",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "Describe this image in one sentence.",
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: image,
                                },
                            },
                        ],
                    },
                ],
            });

            return chatCompletion.choices[0].message;
        }
    }
}