import api from '@/lib/axios';
import axios from 'axios';

export const userService = {


  apiCall: async (endpoint: string, payload: any, msgError: string) => {
    try {
      const response = await api.patch(endpoint, payload);
      console.log(response.data)
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw error.response?.data ?? new Error(msgError);
      }
      throw new Error("Unexpected error occurred");
    }

  },

  updateProfile: async (data: any) => {
    const endpoint = 'settings/profile';
    return await userService.apiCall(endpoint, data, "Failed to update profile");

  },

  updatePassword: async (data: any) => {
    let endpoint = 'settings/password';
    const payload = {
      current_password: data.password,
      new_password: data.newPassword,
      confirm_password: data.confirmPassword,
    }
    return await userService.apiCall(endpoint, payload, "Failed to update password");

  },

  updateLanguage: async (language: string) => {

    let endpoint = `settings/language`;
    let payload = {
      language_code: language,
    };
    return await userService.apiCall(endpoint, payload, "Failed to update language");
  }
  ,

  updateEmail: async (email: string) => {
    let endpoint = `settings/email`;
    let payload = {
      email,
    };

    return await userService.apiCall(endpoint, payload, "Failed to update email");
  }
};