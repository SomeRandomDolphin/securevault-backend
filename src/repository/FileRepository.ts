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
      .from("user_data/" + userId)
      .upload(originalname, buffer, { contentType: mimetype });
  
    return data;
};

export const queryFileDetailbyID = async (fileId: string, userId: number) => {
    const data = await supabase.storage
      .from("user_data/" + userId)
      .download(fileId);
  
    return data;
};

export const removeFile = async (fileId: string, userId: number) => {
    const data = await supabase.storage
      .from("user_data/" + userId)
      .remove([fileId]);
  
    return data;
};
