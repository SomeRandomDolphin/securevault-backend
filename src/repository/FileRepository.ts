import env from "../config/LoacEnv";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

export const createFile = async (
  originalname: string,
  mimetype: string,
  buffer: Buffer,
  userId: number,
) => {
  try {
    const { data, error } = await supabase.storage
      .from("user_data")
      .upload(`${userId}/${Date.now()}-${originalname}`, buffer, { contentType: mimetype });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const queryAllFilebyUserID = async (userId: number) => {
  try {
    const { data, error } = await supabase.storage
      .from("user_data")
      .list(String(userId), {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error listing files:", error);
    throw error;
  }
};

export const queryFileDetailbyID = async (fileId: string, userId: number) => {
  try {
    const { data, error } = await supabase.storage
      .from("user_data")
      .download(`${userId}/${fileId}`);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
};

export const removeFile = async (fileId: string, userId: number) => {
  try {
    const { data, error } = await supabase.storage
      .from("user_data")
      .remove([`${userId}/${fileId}`]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error removing file:", error);
    throw error;
  }
};