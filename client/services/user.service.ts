import api  from '@/lib/axios';

export const userService = {
  updateProfile: async (data ) => {
    try {
      const response = await api.patch('/user/update-profile', data);
      return response.data;
    } catch (error) {

      throw error.response?.data || new Error("Network Error");
    }
  },

  updateLanguage: async (language) => {
    try {
      const response = await api.patch('/user/update-settings', { language });
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error("Failed to update language");
    }
  }
};