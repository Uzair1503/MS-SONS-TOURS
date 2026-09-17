import { prisma } from "../config/prisma";

export const settingRepository = {
  async get(key: string) {
    const setting = await prisma.siteSetting.findUnique({ where: { key } });
    return setting?.value || null;
  },

  async set(key: string, value: string, category: string = "general") {
    return prisma.siteSetting.upsert({
      where: { key },
      update: { value, category },
      create: { key, value, category },
    });
  },

  async getMany(category?: string) {
    const where = category ? { category } : {};
    return prisma.siteSetting.findMany({ where, orderBy: { key: "asc" } });
  },

  async getMap(category?: string) {
    const settings = await this.getMany(category);
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    return map;
  },

  async delete(key: string) {
    return prisma.siteSetting.delete({ where: { key } });
  },
};