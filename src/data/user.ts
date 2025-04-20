import db from "@/lib/db"
import { ensureUuid } from "@/lib/utils"

export const getUserByEmail = async (email: string) => {
  try {
    return await db.user.findUnique({
      where: { email },
    });
  } catch (error) {
    console.error("Error getting user by email:", error);
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    // Convert ID to UUID format if needed
    const uuid = ensureUuid(id);
    
    return await db.user.findUnique({
      where: { id: uuid },
    });
  } catch (error) {
    console.error("Error getting user by id:", error);
    return null;
  }
}; 