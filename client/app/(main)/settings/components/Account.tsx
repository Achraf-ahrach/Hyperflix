"use client"


import ActionSetting from "./ActionSetting";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import LoadingSetting from "./LoadingSetting";
import { ApiError } from "../page";
import api from "@/lib/axios";
import { API_URL } from "@/app/utils";

interface AccountForm {
    email: string;
}


interface SettingProps {
    setSaveSuccess : ( a : boolean) => void,
    setError : (a : ApiError | null ) => void,
    error : ApiError | null

}


export default function Account({setSaveSuccess, setError, error } : SettingProps) {

    const [originalData, setOriginalData] = useState<AccountForm | null>(
    {
        email: '',
    });
    const [formData, setFormData] = useState<AccountForm>({
        email: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [pendingEmail, setPendingEmail] = useState<string>('');


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
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError({ message: 'Please enter a valid email address', field: 'email' });
            return false;
        }
        return true;
    };



    const handleSave = async () => {
        setError(null);


        if (formData.email === originalData?.email)
            return;

        if (!validateForm()) {
            return;
        }

        setIsSaving(true);

        try {
            // Prepare update payload based on active section
            let endpoint = '';
            let payload = {};

            endpoint = `${API_URL}/settings/account`;
            payload = {
                email: formData.email,
            };


            await api.patch(endpoint, payload);

            setPendingEmail(formData.email);

        } catch (err: any) {
            const message = err.response?.data?.message;
            setError({
                message: message || 'Failed to save changes. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading)
        return (<LoadingSetting/>);
    

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-6">Account Settings</h2>
            <div>
                <label className="block text-slate-300 font-medium mb-2">Email Address</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-800/50 border ${error?.field === 'email' ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                    placeholder="Enter email"
                />
                <p className="text-slate-500 text-sm mt-2">
                    You'll receive a verification email to confirm any changes. Your email won't be updated until you click the verification link.
                </p>
            </div>

            {pendingEmail && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="text-amber-400 font-medium text-sm mb-1">Pending Email Verification</p>
                            <p className="text-amber-300 text-sm">
                                Verification email sent to <span className="font-semibold">{pendingEmail}</span>.
                                Check your inbox to complete the change.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <ActionSetting
                isSaving={isSaving}
                handleSave={handleSave}
                handleCancel={handleCancel}
            />
        </div>
    )

}