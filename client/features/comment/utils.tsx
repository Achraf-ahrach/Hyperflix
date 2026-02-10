"use client";



import api from "@/lib/axios";
import { API_URL } from "@/app/utils";
import { Reply } from "./types/types";
import { Comment } from "./types/types";

type UpdateCommentResponse = Pick<Comment, "id" | "content">;

// --- Constants ---
export const INITIAL_BATCH = 10;
export const LOAD_MORE_BATCH = 3;

// --- API Service ---
export const comment_api = {
  async getComments(movieId: string, limit: number, offset: number) {

    const endpoint = `${API_URL}/comments/${movieId}?limit=${limit}&offset=${offset}`;
    
    try
    {
      const response = await api.get(endpoint);
      return await response.data;
    }
    catch (error: any)
    {
      throw error.response?.data || new Error('Failed to load comments');
    }
  },

  async createComment(
    movieId: string,
    content: string,
    media?: File,
  ): Promise<Comment> {
    try {
      const formData = new FormData();
      formData.append("content", content);

      if (media) {
        formData.append("media", media);
      }
      const response = await api.post(
        `/comments/${movieId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error('Failed to create comment');
    }
  }

  ,

  async createReply(
    commentId: number,
    content: string
  ): Promise<Reply> {
    try {
      const response = await api.post(
        `/comments/${commentId}/replies`,
        { content },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;

    } catch (error: any) {
      throw error.response?.data || new Error('Failed to create reply');

    }
  },


  async toggleLike(commentId: number, replyId?: number): Promise<boolean> {
    try {
      if (replyId)
        await api.post(`/comments/${replyId}/like`);
      else
        await api.post(`/comments/${commentId}/like`);
      return true;
    } catch {
      return false;
    }
  },

  async deleteComment(commentId: number, replyId?: number): Promise<boolean> {
    try {
      if (replyId)
        await api.delete(`/comments/${replyId}`);
      else
        await api.delete(`/comments/${commentId}`);
      return true;
    } catch {
      return false;
    }
  },

  async updateComment(commentId: number, content: string): Promise<UpdateCommentResponse> {
    try {
      const response = await api.patch(`/comments/${commentId}`, { content });
      return response.data;
    } catch (error: any) {
        throw error.response?.data || new Error('Failed to update comment');
    }
  },
};

