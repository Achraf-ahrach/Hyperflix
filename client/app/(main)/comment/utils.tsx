"use client";



import api from "@/lib/axios";
import { API_URL } from "@/app/utils";
import { Reply } from "./types/types";
import { Comment } from "./types/types";

// --- Constants ---
export const INITIAL_BATCH = 10;
export const LOAD_MORE_BATCH = 3;



// --- API Service ---
export const comment_api = {
  async getComments(movieId: string, limit: number, offset: number) {

    const endpoint = `${API_URL}/comments/${movieId}?limit=${limit}&offset=${offset}`;

    const response = await fetch(endpoint, {
      method: "GET",
      credentials: "include",
      // body: formData
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to load comments');
    }
    return await response.json();
  },

  async createComment(
    movieId: string,
    content: string,
    media?: File,
  ): Promise<Comment> {
    // await new Promise(r => setTimeout(r, 800));

    const endpoint = `${API_URL}/comments/${movieId}`;
    const formData = new FormData();
    formData.append("content", content);
    console.log(content);
    if (media) formData.append("media", media);
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    return await response.json();
  },

  async createReply(commentId: number, content: string): Promise<Reply> {
    const endpoint = `${API_URL}/comments/${commentId}/replies`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
      credentials: "include",

    });
    return response.json();


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
};

