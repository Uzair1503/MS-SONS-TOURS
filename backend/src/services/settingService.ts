import { settingRepository } from "../repositories/settingRepository";

export const settingService = {
  async get(key: string) {
    return settingRepository.get(key);
  },

  async set(key: string, value: string, category?: string) {
    return settingRepository.set(key, value, category);
  },

  async getAll(category?: string) {
    return settingRepository.getMap(category);
  },

  async getMany(category?: string) {
    return settingRepository.getMany(category);
  },

  async delete(key: string) {
    return settingRepository.delete(key);
  },
};