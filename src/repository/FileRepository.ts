import env from "../config/LoacEnv";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

export const createFile = async (
  originalname: string,
  mimetype: string,
  buffer: Buffer,
  userId: number,
) => {
  const data = await supabase.storage
    .from("user_data")
    .upload(userId + "/" + originalname, buffer, { contentType: mimetype });

  return data;
};

export const queryAllFilebyUserID = async (userId: number) => {
  const data = await supabase.storage.from("user_data").list(String(userId), {
    limit: 100,
    offset: 0,
    sortBy: { column: "name", order: "asc" },
  });

  return data;
};

export const queryFileDetailbyID = async (fileId: string, userId: number) => {
  const data = await supabase.storage
    .from("user_data")
    .download(userId + "/" + fileId);

  return data;
};

export const removeFile = async (fileId: string, userId: number) => {
  const data = await supabase.storage
    .from("user_data")
    .remove([userId + "/" + fileId]);

  return data;
};
