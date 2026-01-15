"use client"

import { Camera, Check, Loader2, User, X } from "lucide-react"
import { useEffect, useState } from "react";
import ActionSetting from "./ActionSetting";
import LoadingSetting from "./LoadingSetting";
import { ApiError } from "../page";



interface ProfileForm {
    firstName: string,
    lastName: string,
    username: string,
    profilePicture: string,

}




interface SettingProps {
    setSaveSuccess : ( a : boolean) => void,
    setError : (a : ApiError | null ) => void,
    error : ApiError | null

}

export default function Profile({setSaveSuccess , setError, error} : SettingProps) {
    
    const [originalData, setOriginalData] = useState<ProfileForm | null>(null);
    const [formData, setFormData] = useState<ProfileForm>({
        firstName: '',
        lastName: '',
        username: '',
        profilePicture: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);



    useEffect(() => {
        fetchUserData();
      }, []);
    
      const fetchUserData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock response data
          const userData = {
            firstName: 'John',
            lastName: 'Doe',
            username: 'johndoe',
            profilePicture: '',
          };
    
          setFormData(userData);
        //   setOriginalData(userData);
        } catch (err) {
          setError({ message: 'Failed to load user data. Please try again.' });
        } finally {
          setIsLoading(false);
        }
      };



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
    
        if (formData.username && formData.username.length < 3) {
            setError({ message: 'Username must be at least 3 characters', field: 'username' });
            return false;
        }

        if (originalData !== null && formData.username === originalData.username
            && formData.firstName === originalData.firstName
            && formData.lastName === originalData.lastName
        )
            return true;
    
        setIsSaving(true);
    
        try {

            
            
          let endpoint = `/user/profile`;
          let payload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
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
          
          // Handle email change - set pending email and show verification message
         
    
          setFormData(updatedData);
          setSaveSuccess(true);
          setOriginalData(updatedData);

          
        } catch (err: any) {
          setError({ 
            message: err.message || 'Failed to save changes. Please try again.' 
          });
        } finally {
          setIsSaving(false);
        }
      };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError({ message: 'Image size must be less than 5MB', field: 'profilePicture' });
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError({ message: 'Please upload a valid image file', field: 'profilePicture' });
            return;
        }

        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Image = reader.result as string;

                // Simulate upload to server
                setIsSaving(true);
                await new Promise(resolve => setTimeout(resolve, 1500));

                // const response = await fetch(`${API_BASE_URL}/user/profile-picture`, {
                //   method: 'POST',
                //   headers: { 'Content-Type': 'application/json' },
                //   body: JSON.stringify({ image: base64Image })
                // });

                setFormData({ ...formData, profilePicture: base64Image });
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
                setIsSaving(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError({ message: 'Failed to upload image', field: 'profilePicture' });
            setIsSaving(false);
        }
    };


    if (isLoading)
        return (<LoadingSetting/>);
    

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>

            {/* Profile Picture */}
            <div className="flex items-center gap-6">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center overflow-hidden">
                        {formData.profilePicture ? (
                            <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={40} className="text-white" />
                        )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera size={24} className="text-white" />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={isSaving}
                        />
                    </label>
                </div>
                <div>
                    <h3 className="text-white font-semibold mb-1">Profile Picture</h3>
                    <p className="text-slate-400 text-sm">JPG, PNG or GIF. Max 5MB</p>
                </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-slate-300 font-medium mb-2">First Name</label>
                    <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-800/50 border ${error?.field === 'firstName' ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                        placeholder="Enter first name"
                    />
                </div>
                <div>
                    <label className="block text-slate-300 font-medium mb-2">Last Name</label>
                    <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full bg-slate-800/50 border ${error?.field === 'lastName' ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
                        placeholder="Enter last name"
                    />
                </div>
            </div>

            <div>
                <label className="block text-slate-300 font-medium mb-2">Username</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-800/50 border ${error?.field === 'username' ? 'border-red-500' : 'border-slate-700'} rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all`}
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