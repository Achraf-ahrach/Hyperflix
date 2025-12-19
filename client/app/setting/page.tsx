"use client"


import React, { useState, useEffect } from 'react';
import { Camera, Mail, User, Lock, Globe, Check, X, Loader2, AlertCircle } from 'lucide-react';

interface SettingsForm {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  language: string;
  profilePicture: string;
}

interface ApiError {
  message: string;
  field?: string;
}

const SettingsPage: React.FC = () => {
  const [formData, setFormData] = useState<SettingsForm>({
    email: '',
    firstName: '',
    lastName: '',
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    language: 'en',
    profilePicture: '',
  });

  const [originalData, setOriginalData] = useState<SettingsForm | null>(null);
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>('');

  // Simulated API endpoints
  const API_BASE_URL = '/api';

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // Check for changes whenever formData updates
  useEffect(() => {
    if (originalData) {
      const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response data
      const userData = {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        language: 'en',
        profilePicture: '',
      };

      setFormData(userData);
      setOriginalData(userData);
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
        
        // In production, you would upload to storage service (S3, Cloudinary, etc.)
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

  const validateForm = (): boolean => {
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError({ message: 'Please enter a valid email address', field: 'email' });
      return false;
    }

    // Username validation
    if (formData.username && formData.username.length < 3) {
      setError({ message: 'Username must be at least 3 characters', field: 'username' });
      return false;
    }

    // Password validation if changing password
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
      let payload = {};

      switch (activeSection) {
        case 'profile':
          endpoint = `${API_BASE_URL}/user/profile`;
          payload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
          };
          break;
        case 'account':
          endpoint = `${API_BASE_URL}/user/account`;
          payload = {
            email: formData.email,
          };
          
          // For email changes, we send a verification email
          // The email won't be updated until user confirms via email link
          break;
        case 'security':
          endpoint = `${API_BASE_URL}/user/password`;
          payload = {
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          };
          break;
        case 'preferences':
          endpoint = `${API_BASE_URL}/user/preferences`;
          payload = {
            language: formData.language,
          };
          break;
      }

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
      if (activeSection === 'account' && formData.email !== originalData?.email) {
        setPendingEmail(formData.email);
        setEmailVerificationSent(true);
        // Revert email to original until verified
        updatedData.email = originalData?.email || formData.email;
        setTimeout(() => setEmailVerificationSent(false), 10000);
      }
      
      // Clear password fields after successful update
      if (activeSection === 'security') {
        updatedData.currentPassword = '';
        updatedData.newPassword = '';
        updatedData.confirmPassword = '';
      }

      setFormData(updatedData);
      setOriginalData(updatedData);
      
      // Don't show generic success for email changes
      if (activeSection !== 'account' || formData.email === originalData?.email) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setError({ 
        message: err.message || 'Failed to save changes. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData);
      setError(null);
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account preferences and settings</p>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Check className="text-emerald-400 flex-shrink-0" size={20} />
            <p className="text-emerald-400 font-medium">Settings saved successfully!</p>
          </div>
        )}

        {/* Email Verification Message */}
        {emailVerificationSent && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <Mail className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-blue-400 font-medium mb-1">Verification Email Sent</p>
                <p className="text-blue-300 text-sm">
                  We've sent a verification link to <span className="font-semibold">{pendingEmail}</span>. 
                  Please check your inbox and click the link to confirm your new email address.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-400 font-medium">{error.message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-2 sticky top-4">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'account', label: 'Account', icon: Mail },
                { id: 'security', label: 'Security', icon: Lock },
                { id: 'preferences', label: 'Preferences', icon: Globe },
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-red-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <section.icon size={20} />
                  <span className="font-medium">{section.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-8">
              {/* Profile Section */}
              {activeSection === 'profile' && (
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
                </div>
              )}

              {/* Account Section */}
              {activeSection === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Account Settings</h2>
                  
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

                  {pendingEmail && pendingEmail !== formData.email && (
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
                </div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
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
                </div>
              )}

              {/* Preferences Section */}
              {activeSection === 'preferences' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white mb-6">Preferences</h2>
                  
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
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-slate-800">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving || !hasChanges}
                  className="px-6 py-3 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <X size={20} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;