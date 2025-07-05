'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveSettings, getSettings } from './actions/settings-actions';
import { deleteAccount, exportUserData } from './actions/account-actions';
import { getAvailableLanguages } from './actions/language-actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Bell, Shield, Globe, Download, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [availableLanguages, setAvailableLanguages] = useState<
    { code: string; name: string }[]
  >([]);
  const router = useRouter();

  useEffect(() => {
    const fetchInitialSettings = async () => {
      if (user) {
        const fetchedSettings = await getSettings();
        if (fetchedSettings) {
          setSettings(fetchedSettings);
        }
        const languages = await getAvailableLanguages();
        setAvailableLanguages(languages);
      }
    };
    fetchInitialSettings();
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save settings.',
        variant: 'destructive',
      });
      return;
    }
    await saveSettings(settings);
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        'Are you sure you want to delete your account? This action cannot be undone.',
      )
    ) {
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to delete your account.',
          variant: 'destructive',
        });
        return;
      }
      await deleteAccount(user.id);
    }
  };

  const handleExportData = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to export data.',
        variant: 'destructive',
      });
      return;
    }
    await exportUserData(user.id);
  };

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>You must be logged in to view this page.</p>
          <Button
            className="p-3 text-white border border-primary mt-3"
            onClick={() => router.push('/auth')}
          >
            Create an account or log in.
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and privacy settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Configure how you receive notifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.email_notifications}
                  onCheckedChange={(checked) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        email_notifications: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your device
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.notifications.push_notifications}
                  onCheckedChange={(checked) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        push_notifications: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via SMS
                  </p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={settings.notifications.sms_notifications}
                  onCheckedChange={(checked) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        sms_notifications: checked,
                      },
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="new-messages">New Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you receive new messages
                  </p>
                </div>
                <Switch
                  id="new-messages"
                  checked={settings.notifications.new_messages}
                  onCheckedChange={(checked) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        new_messages: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="listing-updates">Listing Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about your listing activity
                  </p>
                </div>
                <Switch
                  id="listing-updates"
                  checked={settings.notifications.listing_updates}
                  onCheckedChange={(checked) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        listing_updates: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-emails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Opt in to receive promotional emails and updates
                  </p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={settings.notifications.marketing_emails}
                  onCheckedChange={(checked) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        marketing_emails: checked,
                      },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                <div>
                  <CardTitle>Privacy & Security</CardTitle>
                  <CardDescription>
                    Control your privacy and security settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Who can see your profile
                  </p>
                </div>
                <Select
                  value={settings.privacy.profile_visibility}
                  onValueChange={(value) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      privacy: { ...prev.privacy, profile_visibility: value },
                    }))
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-phone">Show Phone Number</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your phone number on your profile
                  </p>
                </div>
                <Switch
                  id="show-phone"
                  checked={settings.privacy.show_phone}
                  onCheckedChange={(checked) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      privacy: { ...prev.privacy, show_phone: checked },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-email">Show Email Address</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your email address on your profile
                  </p>
                </div>
                <Switch
                  id="show-email"
                  checked={settings.privacy.show_email}
                  onCheckedChange={(checked) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      privacy: { ...prev.privacy, show_email: checked },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-last-seen">Show Last Seen</Label>
                  <p className="text-sm text-muted-foreground">
                    Show when you were last active
                  </p>
                </div>
                <Switch
                  id="show-last-seen"
                  checked={settings.privacy.show_last_seen}
                  onCheckedChange={(checked) =>
                    setSettings((prev: any) => ({
                      ...prev,
                      privacy: { ...prev.privacy, show_last_seen: checked },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                <div>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>
                    Customize your app experience
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.preferences.language}
                    onValueChange={(value) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        preferences: { ...prev.preferences, language: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.preferences.currency}
                    onValueChange={(value) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        preferences: { ...prev.preferences, currency: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="KES">KES (KSh)</SelectItem>
                      <SelectItem value="UGX">UGX (USh)</SelectItem>
                      <SelectItem value="TZS">TZS (TSh)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.preferences.timezone}
                    onValueChange={(value) =>
                      setSettings((prev: any) => ({
                        ...prev,
                        preferences: { ...prev.preferences, timezone: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Africa/Nairobi">
                        East Africa Time
                      </SelectItem>
                      <SelectItem value="Africa/Lagos">
                        West Africa Time
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <div className="flex items-center">
                <Download className="h-5 w-5 mr-2" />
                <div>
                  <CardTitle>Data & Privacy</CardTitle>
                  <CardDescription>
                    Manage your data and account
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Export Your Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Download a copy of your data
                  </p>
                </div>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-destructive">
                    Delete Account
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings}>Save All Settings</Button>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}