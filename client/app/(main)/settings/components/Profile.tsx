"use client"

import { Camera, Check, Loader2, User, X } from "lucide-react"
import { useEffect, useState } from "react";
import ActionSetting from "./ActionSetting";
import LoadingSetting from "./LoadingSetting";
import { ApiError } from "../page";
import { useUser } from "@/lib/contexts/UserContext";
import { useQueryClient } from "@tanstack/react-query";
import { User as UserData } from "@/lib/contexts/UserContext";
import api from "@/lib/axios";
import { API_URL } from "@/app/utils";


interface ProfileForm {
    firstName: string,
    lastName: string,
    username: string,
    profilePicture: string,

}




interface SettingProps {
    setSaveSuccess: (a: boolean) => void,
    setError: (a: ApiError | null) => void,
    error: ApiError | null

}

export default function Profile({ setSaveSuccess, setError, error }: SettingProps) {


    const queryClient = useQueryClient();
    const { user } = useUser();
    const [originalData, setOriginalData] = useState<ProfileForm | null>(null);
    const [formData, setFormData] = useState<ProfileForm>({
        firstName: '',
        lastName: '',
        username: '',
        profilePicture: '',
    });



    const [isSaving, setIsSaving] = useState(false);
    // const [isLoading, setIsLoading] = useState(true);


    useEffect(() => {
        if (!user) return;
        if (user.avatarUrl && !user.avatarUrl.startsWith('http')) {
            user.avatarUrl = `${API_URL}${user.avatarUrl}`;
        }
        const data = {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            profilePicture: `${user.avatarUrl ?? ''}`,
        };
        console.log('Loaded user data:', data);
        setFormData(data);
        setOriginalData(data);
    }, [user]);





    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleCancel = () => {
        if (originalData) {
            setFormData(originalData);
            setError(null);
        }
    };


    const handleSave = async () => {
        setError(null);

        if (!formData.username || (formData.username && formData.username.length < 3)) {
            setError({ message: 'Username must be at least 3 characters', field: 'username' });
            return false;
        }
        if (!formData.firstName || (formData.firstName && formData.firstName.length < 2)) {
            setError({ message: 'First name must be at least 2 characters', field: 'firstName' });
            return false;
        }
        if (!formData.lastName || (formData.lastName && formData.lastName.length < 2)) {
            setError({ message: 'Last name must be at least 2 characters', field: 'lastName' });
            return false;
        }
        if (originalData !== null && formData.username === originalData.username
            && formData.firstName === originalData.firstName
            && formData.lastName === originalData.lastName
        )
            return true;

        setIsSaving(true);

        try {

            let endpoint = `/settings/profile`;
            let payload = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                username: formData.username,
            };

            await api.patch(endpoint, payload);
            const updatedData = { ...formData };

            queryClient.setQueryData<UserData | null>(
                ["auth", "profile"],
                (oldUser) =>
                    oldUser
                        ? { ...oldUser, firstName: formData.firstName, lastName: formData.lastName, username: formData.username }
                        : oldUser
            );
            setFormData(updatedData);
            setSaveSuccess(true);
            setOriginalData(updatedData);


        } catch (err: any) {
            setError({
                message: err.response?.data?.message || err.message || 'Failed to save changes. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

  
        if (file.size > 5 * 1024 * 1024) {
            setError({ message: 'Image size must be less than 5MB', field: 'profilePicture' });
            return;
        }
        if (!file.type.startsWith('image/')) {
            setError({ message: 'Please upload a valid image file', field: 'profilePicture' });
            return;
        }

        try {

            setIsSaving(true);
            const bodyFormData = new FormData();
            bodyFormData.append('image', file);
            const response = await api.patch('/settings/image', bodyFormData);
            console.log(response);
            setFormData({ ...formData, profilePicture: `${API_URL}${response.data.url}` });
            setSaveSuccess(true);
            queryClient.setQueryData<UserData | null>(
                ["auth", "profile"],
                (oldUser) =>
                    oldUser
                        ? { ...oldUser, avatarUrl: `${API_URL}${response.data.url}`}
                        : oldUser
            );

        } catch (err) {
            setError({ message: 'Failed to upload image', field: 'profilePicture' });
            setSaveSuccess(false);
        }
        finally{
            setIsSaving(false);
        }
    };


    // if (isLoading)
    //     return (<LoadingSetting/>);


    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6">Profile Information</h2>

            {/* Profile Picture */}
            <div className="flex items-center gap-6">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center overflow-hidden">
                        {formData.profilePicture ? (
                            <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={40}  />
                        )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera size={24}  />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="sr-only"
                            disabled={isSaving}
                        />
                    </label>
                </div>
                <div>
                    <h3 className="font-semibold mb-1">Profile Picture</h3>
                    <p className="text-slate-400 text-sm">JPG, PNG or GIF. Max 5MB</p>
                </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block font-medium mb-2">First Name</label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full  border ${error?.field === 'firstName' ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                        placeholder="Enter first name"
                    />
                </div>
                <div>
                    <label className="block  font-medium mb-2">Last Name</label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full border ${error?.field === 'lastName' ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3  placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                        placeholder="Enter last name"
                    />
                </div>
            </div>

            <div>
                <label className="block font-medium mb-2">Username</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full border ${error?.field === 'username' ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                    placeholder="Enter username"
                />
            </div>

            <ActionSetting
                isSaving={isSaving}
                handleSave={handleSave}
                handleCancel={handleCancel}
            />
        </div>
    )
}