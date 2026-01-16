"use client"

import { useState } from "react";
import Profile from "./components/Profile";
import Account from "./components/Account";

import {Mail, User, Lock, Globe, Check, AlertCircle } from 'lucide-react';
import Security from "./components/Security";


export interface ApiError {
    message: string;
    field?: string;
  }
  

export default function SettingsPage() {

    const [activeSection, setActiveSection] = useState<string>('profile');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<ApiError | null>(null);
    
    
    return (

        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
                    <p className="text-slate-400">Manage your account and settings</p>
                </div>

                {/* Success Message */}
                {saveSuccess && (
                <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Check className="text-emerald-400 flex-shrink-0" size={20} />
                    <p className="text-emerald-400 font-medium">Settings saved successfully!</p>
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
                                // { id: 'preferences', label: 'Preferences', icon: Globe },
                            ].map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeSection === section.id
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

                    <div className="lg:col-span-3">
                        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800 p-8">
                            
                            {
                                activeSection === "profile" && (
                                    <Profile setSaveSuccess={setSaveSuccess} setError={setError} error={error}/>
                                )
                            }
                            {
                                activeSection === "account" && (
                                    <Account setSaveSuccess={setSaveSuccess} setError={setError} error={error}/>
                                )
                            }
                            {
                                activeSection === "security" && (
                                    <Security setSaveSuccess={setSaveSuccess} setError={setError} error={error}/>
                                )
                            }

                        </div>
                    </div>
                </div>


            </div>
        </div>
    )


} 