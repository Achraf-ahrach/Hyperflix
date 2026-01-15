"use client"

import { Camera, Check, Loader2, User, X } from "lucide-react"
import { useEffect, useState } from "react";

import ActionSetting from "./ActionSetting";
import { ApiError } from "../page";



interface PasswordForm {
    currentPassword:  string,
    newPassword: string,
    confirmPassword:  string,
}

interface SettingProps {
    setSaveSuccess : ( a : boolean) => void,
    setError : (a : ApiError | null ) => void,
    error : ApiError | null

}
export default function Security({setSaveSuccess, setError, error} : SettingProps) {


    const [originalData, setOriginalData] = useState<PasswordForm | null>(null);
    const [formData, setFormData] = useState<PasswordForm>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',

    });
    const [isSaving, setIsSaving] = useState(false);


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

    const validateForm = (): boolean => {
        if (formData.newPassword) {
            if (!formData.currentPassword) {
                setError({ message: 'Current password is required', field: 'currentPassword' });
                return false;
            }

            if (formData.newPassword.length < 8) {
                setError({ message: 'New password must be at least 8 characters', field: 'newPassword' });
                return false;
            }

            if (formData.newPassword !== formData.confirmPassword) {
                setError({ message: 'Passwords do not match', field: 'confirmPassword' });
                return false;
            }
        }
        return true;
    };

    const handleSave = async () => {
        setError(null);

        if (!validateForm()) {
            return;
        }

        setIsSaving(true);

        try {
            // Prepare update payload based on active section
            let endpoint = '';


            endpoint = `/user/password`;
            let payload = {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            };

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // In production:
            // const response = await fetch(endpoint, {
            //   method: 'PATCH',
            //   headers: {
            //     'Content-Type': 'application/json',
            //     'Authorization': `Bearer ${token}`
            //   },
            //   body: JSON.stringify(payload)
            // });
            //
            // if (!response.ok) {
            //   const errorData = await response.json();
            //   throw new Error(errorData.message || 'Failed to update settings');
            // }
            //
            // const updatedData = await response.json();

            // Mock successful response
            const updatedData = { ...formData };

            // Clear password fields after successful update

            updatedData.currentPassword = '';
            updatedData.newPassword = '';
            updatedData.confirmPassword = '';


            setSaveSuccess(true);
            setFormData(updatedData);
            setOriginalData(updatedData);
        } catch (err: any) {
            setError({
                message: err.message || 'Failed to save changes. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Security</h2>

            <div>
                <label className="block text-slate-300 font-medium mb-2">Current Password</label>
                <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-800/50 border ${error?.field === 'currentPassword' ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                    placeholder="Enter current password"
                />
            </div>

            <div>
                <label className="block text-slate-300 font-medium mb-2">New Password</label>
                <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-800/50 border ${error?.field === 'newPassword' ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                    placeholder="Enter new password"
                />
                <p className="text-slate-500 text-sm mt-2">Must be at least 8 characters</p>
            </div>

            <div>
                <label className="block text-slate-300 font-medium mb-2">Confirm New Password</label>
                <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-800/50 border ${error?.field === 'confirmPassword' ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                    placeholder="Confirm new password"
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
