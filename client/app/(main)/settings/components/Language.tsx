







"use client"
import ActionSetting from "./ActionSetting";
import { use, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import LoadingSetting from "./LoadingSetting";
import { ApiError } from "../page";
import api from "@/lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/lib/contexts/UserContext";

import { User as UserData } from "@/lib/contexts/UserContext";


interface SettingProps {
    setSaveSuccess: (a: boolean) => void,
    setError: (a: ApiError | null) => void,
    error: ApiError | null

}


interface LanguageForm {
    language: string;
}

export default function LanguagePreference({ setSaveSuccess, setError, error }: SettingProps) {

    const queryClient = useQueryClient();
    const { user } = useUser();

    const [originalData, setOriginalData] = useState<LanguageForm | null>(
        {
            language: '',
        });
    const [formData, setFormData] = useState<LanguageForm>({
        language: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentLanguage, setCurrentLanguage] = useState('');
    const code_langue = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
    };
    useEffect(() => {
        if (!user) return;

        const data = {
            language: user.langue_code,
        };
        setFormData(data);
        setOriginalData(data);
        setIsLoading(false);
        setCurrentLanguage(code_langue[user.langue_code as keyof typeof code_langue]);
    }, [user]);

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
    ];


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

        if (formData.language === originalData?.language)
            return;

        setIsSaving(true);

        try {
            let endpoint = '';
            let payload = {};

            endpoint = `settings/language`;
            payload = {
                language_code: formData.language,
            };

            await api.patch(endpoint, payload);
            console.log(user);
            const updatedData = { ...formData };

            setFormData(updatedData);
            setOriginalData(updatedData);
            setSaveSuccess(true);
            queryClient.setQueryData<UserData | null>(
                ["auth", "profile"],
                (oldUser) =>
                    oldUser
                        ? { ...oldUser, langue_code: formData.language }
                        : oldUser
            );
        } catch (err: any) {
            setError({
                message: err.message || 'Failed to save changes. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading)
        return (<LoadingSetting />);


    return (


        <div className="space-y-6">
            <h2 className="text-xl font-bold  mb-6">Preferences</h2>

            <div>
                <label className="block  font-medium mb-2">Preferred Language</label>
                <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full border border-slate-700 rounded-lg px-4 py-3  focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all cursor-pointer"
                >
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-slate-800">
                            {lang.name}
                        </option>
                    ))}
                </select>
                <p className="text-slate-500 text-sm mt-2">Choose your preferred language for the interface</p>
            </div>

            <ActionSetting
                isSaving={isSaving}
                handleSave={handleSave}
                handleCancel={handleCancel}
            />
        </div>
    )

}