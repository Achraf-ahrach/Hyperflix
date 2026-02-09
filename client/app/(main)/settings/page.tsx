"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun, User, Lock, Globe, Camera } from 'lucide-react';
import { User as UserData, useUser } from '@/lib/contexts/UserContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { set, z } from 'zod';
import { userService } from '@/services/user.service';
import { API_URL } from '@/app/utils';
import { is } from 'zod/v4/locales';
import { toast } from 'sonner';
// import { toast } from 'sonner';


const profileSchema = z.object({
  firstName: z.string().min(1, "First name is too short").max(50),
  lastName: z.string().min(1, "Last name is too short").max(50),
  username: z.string().min(3, "Username must be at least 3 characters").toLowerCase(),
  avatar: z.any().optional()
});


const emailSchema = z.object({
  email: z.email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;


const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  newPassword: z.string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Za-z]/, "New password must contain at least one letter")
    .regex(/[0-9]/, "New password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "New password must contain at least one special character"),
  confirmPassword: z.string().min(8, "Confirm password should match the new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
});



type PasswordFormValues = z.infer<typeof passwordSchema>;


const SettingsPage = () => {

  const { user } = useUser();
  const queryClient = useQueryClient();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formPasswordErrors, setFormPasswordErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatarUrl || null);
  const [language_code, setLanguage_code] = useState(user?.langue_code || 'en');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showWatchedPublic, setShowWatchedPublic] = useState(user?.showWatchedPublic ?? true);
  const [showWatchlistPublic, setShowWatchlistPublic] = useState(user?.showWatchlistPublic ?? true);


  useEffect(() => {
    if (user?.langue_code) {
      setLanguage_code(user.langue_code);
    }
    if (user?.showWatchedPublic !== undefined) {
      setShowWatchedPublic(user.showWatchedPublic);
    }
    if (user?.showWatchlistPublic !== undefined) {
      setShowWatchlistPublic(user.showWatchlistPublic);
    }
  }, [user]);


  const { mutate, isPending } = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: (result : any) => {
      queryClient.setQueryData<UserData | null>(
        ["auth", "profile"],
        (oldUser : any) =>
          oldUser
            ? {
              ...oldUser,
              ...result
            }
            : oldUser
      );
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast.success("Profile updated!");
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });


  const { mutate: mutatePassword, isPending: isPasswordPending } = useMutation({
    mutationFn: userService.updatePassword,
    onSuccess: () => {
      toast.success("Password updated!");
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });


  const { mutate: mutateLanguage, isPending: isLanguagePending } = useMutation({
    mutationFn: userService.updateLanguage,
    onSuccess: () => {
      queryClient.setQueryData<UserData | null>(
        ["profile"],
        (oldUser : any) =>
          oldUser
            ? { ...oldUser, langue_code: language_code }
            : oldUser
      );
      setIsPreviewMode(false)
      toast.success("Language updated!");
    },
    onError: (err: any) => {
      // console.log(err.message);
      toast.error(err.message)
      setIsPreviewMode(false)

    }
  });

  const { mutate: mutateEmail, isPending: isEmailPending } = useMutation({
    mutationFn: userService.updateEmail,
    onSuccess: () => {
      toast.success("Success: A link is sent to your email!");
    },
    onError: (err: any) => {
      // console.log(err.message);
      toast.error(err.message);
    }
  });


  const { mutate: mutatePreferences, isPending: isPreferencesPending } = useMutation({
    mutationFn: userService.updatePreferences,
    onSuccess: (result: any) => {
      queryClient.setQueryData<UserData | null>(
        ["auth", "profile"],
        (oldUser: any) =>
          oldUser
            ? {
                ...oldUser,
                ...result,
              }
            : oldUser
      );
      toast.success("Visibility preferences updated!");
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });


  let startUrl = '';
  if (!isPreviewMode) {
    if (previewUrl) {
      if (previewUrl.startsWith('http')) {
        startUrl = '';
      }
      else startUrl = API_URL;
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large (Max 5MB)");
        return;
      }

      const url = URL.createObjectURL(file);
      setIsPreviewMode(true);
      setPreviewUrl(url);
    }
  };



  const handleProfileUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormErrors({});


    console.log(previewUrl);
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    const dataToValidate = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      username: formData.get('username'),
      avatar: formData.get('avatar'),
    };

    const result = profileSchema.safeParse(dataToValidate);


    if (!result.success) {
      console.log(result.error);
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue : any) => {
        errors[issue.path[0] as string] = issue.message;
      });
      return setFormErrors(errors);
    }
    console.log(formData)
    mutate(formData);

  };



  const handleEmailUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormErrors({});
    const formData = new FormData(event.currentTarget);
    const rawData = Object.fromEntries(formData);
    console.log(rawData);
    const result = emailSchema.safeParse(rawData);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue : any) => {
        errors[issue.path[0] as string] = issue.message;
      });
      return setFormErrors(errors);
    }

    mutateEmail(result.data.email);
  }


  const handlePasswordUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormPasswordErrors({});
    const formData = new FormData(event.currentTarget);
    const rawData = Object.fromEntries(formData);
    console.log(rawData);
    const result = passwordSchema.safeParse(rawData);
    console.log("Jj")
    console.log(result);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue: any) => {
        errors[issue.path[0] as string] = issue.message;
      });
      return setFormPasswordErrors(errors);
    }

    mutatePassword(result.data);
  };


  const handleLanguageUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = { language: language_code };
    console.log(data);
    mutateLanguage(language_code);
  }

  const handlePreferencesUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutatePreferences({
      showWatchedPublic,
      showWatchlistPublic,
    });
  }
  const handleAvatarChange = () => {
    // Trigger file input
    console.log('Change avatar');
  };

  return (
    <div  >
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
            </div>

          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="profile" className="w-full" onValueChange={() => {
            setFormPasswordErrors({});
            setFormErrors({});
          }}>
            <TabsList className="w-fit mb-8">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Lock className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <Globe className="w-4 h-4" />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information and profile picture</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={`${startUrl}${previewUrl || ''}`} />
                        <AvatarFallback>{user?.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <input
                          type="file"
                          name="avatar"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          // onClick={handleAvatarChange}
                          className="gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Change Avatar
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          JPG, PNG or GIF. Max size 2MB.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* First Name */}
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          defaultValue={user?.firstName}
                          placeholder="Enter your first name"
                          className={`border ${formErrors.firstName ? "border-red-500" : "border-slate-400"}`}
                        />
                        {formErrors.firstName && <span className="text-xs text-red-500">{formErrors.firstName}</span>}
                      </div>

                      {/* Last Name */}
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          defaultValue={user?.lastName}
                          name="lastName"
                          placeholder="Enter your last name"
                          className={`border ${formErrors.lastName ? "border-red-500" : "border-slate-400"}`}
                        />
                        {formErrors.lastName && <span className="text-xs text-red-500">{formErrors.lastName}</span>}

                      </div>
                    </div>

                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        defaultValue={user?.username}
                        name="username"
                        placeholder="Enter your username"
                        className={`border ${formErrors.username ? "border-red-500" : "border-slate-400"}`}
                      />
                      {formErrors.username && <span className="text-xs text-red-500">{formErrors.username}</span>}
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>

                  <form onSubmit={handleEmailUpdate} className="space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue={user?.email}
                        name="email"
                        placeholder="Enter your email"
                        className={`border ${formErrors.email ? "border-red-500" : "border-slate-400"}`}
                        disabled={user?.provider !== 'local'}
                      />
                      {formErrors.email && <span className="text-xs text-red-500">{formErrors.email}</span>}
                    </div>
                    {/* Email */}
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isEmailPending || user?.provider !== 'local'}>
                        {isEmailPending ? "Saving..." : "Update Email"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Password & Security</CardTitle>
                  <CardDescription>Manage your password and security settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordUpdate} className="space-y-6" >
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        name="password"
                        placeholder="Enter your current password"
                        className={`border ${formPasswordErrors.password ? "border-red-500" : "border-slate-400"}`}
                        disabled={user?.provider !== 'local'}

                      />
                      {formPasswordErrors.password && <span className="text-xs text-red-500">{formPasswordErrors.password}</span>}
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        name="newPassword"
                        placeholder="Enter your new password"
                        className={`border ${formPasswordErrors.newPassword ? "border-red-500" : "border-slate-400"}`}
                        disabled={user?.provider !== 'local'}
                      />
                      {formPasswordErrors.newPassword && <span className="text-xs text-red-500">{formPasswordErrors.newPassword}</span>}
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 8 characters long
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm your new password"
                        className={`border ${formPasswordErrors.confirmPassword ? "border-red-500" : "border-slate-400"}`}
                        disabled={user?.provider !== 'local'}
                      />
                      {formPasswordErrors.confirmPassword && <span className="text-xs text-red-500">{formPasswordErrors.confirmPassword}</span>}
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isPasswordPending || user?.provider !== 'local'}>Update Password</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={handleLanguageUpdate}>
                    {/* Language */}
                    <div className="space-y-2">
                      <Label htmlFor="language">Preferred Language</Label>
                      <Select
                        value={language_code}
                        onValueChange={(value) => setLanguage_code(value)}
                      >
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isLanguagePending}>
                        {isLanguagePending ? "Saving..." : "Save Language"}
                      </Button>
                    </div>
                  </form>

                  <form className="space-y-6 mt-8" onSubmit={handlePreferencesUpdate}>
                    <div className="space-y-4 rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label htmlFor="watched-visibility" className="text-sm font-medium">
                            Share watched movies
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Allow other users to see your watched history on your profile.
                          </p>
                        </div>
                        <Switch
                          id="watched-visibility"
                          checked={showWatchedPublic}
                          onCheckedChange={(checked) => setShowWatchedPublic(!!checked)}
                          disabled={isPreferencesPending}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <Label htmlFor="watchlist-visibility" className="text-sm font-medium">
                            Share watchlist
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Control whether others can view your watch later list.
                          </p>
                        </div>
                        <Switch
                          id="watchlist-visibility"
                          checked={showWatchlistPublic}
                          onCheckedChange={(checked) => setShowWatchlistPublic(!!checked)}
                          disabled={isPreferencesPending}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isPreferencesPending}>
                        {isPreferencesPending ? "Saving..." : "Update Visibility"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;