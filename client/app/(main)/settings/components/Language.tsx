







"use client"


import ActionSetting from "./ActionSetting";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import LoadingSetting from "./LoadingSetting";
import { ApiError } from "../page";



interface SettingProps {
    setSaveSuccess: (a: boolean) => void,
    setError: (a: ApiError | null) => void,
    error: ApiError | null

}


interface LanguageForm {
    language: string;
}

export default function LanguagePreference({ setSaveSuccess, setError, error }: SettingProps) {

    const [originalData, setOriginalData] = useState<LanguageForm | null>(
    {
        language: 'en',
    });
    const [formData, setFormData] = useState<LanguageForm>({
        language: 'en',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [pendingEmail, setPendingEmail] = useState<string>('');
    // const [emailVerificationSent, setEmailVerificationSent] = useState(false);


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
            // Prepare update payload based on active section
            let endpoint = '';
            let payload = {};

            endpoint = `settings/language`;
            payload = {
                language: formData.language,
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
            // if (!response.ok) {            setSaveSuccess(true);

            //
            // const updatedData = await response.json();

            // Mock successful response
            const updatedData = { ...formData };

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

    if (isLoading)
        return (<LoadingSetting />);


    return (


        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-6">Preferences</h2>

            <div>
                <label className="block text-slate-300 font-medium mb-2">Preferred Language</label>
                <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all cursor-pointer"
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