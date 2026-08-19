import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi } from '@/core/contexts/api.context';
import { Edit2, Save, X } from 'lucide-react';

export default function Settings() {
  const { settings } = useApi();
  const [isEditing, setIsEditing] = useState(false);
  const [srmCollegeEmail, setSrmCollegeEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      settings.fetch();
    }
  }, []);

  useEffect(() => {
    if (settings?.config) {
      setSrmCollegeEmail(settings.config.srmCollegeEmail ?? "");
    }
  }, [settings?.config]);

  const handleSave = async () => {
    if (!srmCollegeEmail.trim()) return;
    setSaving(true);
    try {
      await settings.update({
        srmCollegeEmail: srmCollegeEmail.trim(),
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings?.config) {
      setSrmCollegeEmail(settings.config.srmCollegeEmail ?? "");
    }
    setIsEditing(false);
  };

  if (settings?.loading && !settings?.config) {
    return (
      <div className="flex justify-center items-start pt-10 px-4">
        <Card className="w-full max-w-md bg-card/60 backdrop-blur-md border animate-pulse">
          <CardHeader className="h-24"></CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start pt-10 px-4">
      <Card className="w-full max-w-md bg-card/40 backdrop-blur-lg border shadow-sm transition-all duration-300 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
              System Settings
            </CardTitle>
            <CardDescription className="text-xs">
              Configure SRM College Xerox and global system parameters.
            </CardDescription>
          </div>
          {settings?.allowEdit && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 hover:bg-muted"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Settings
            </Button>
          )}
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold" htmlFor="srmCollegeEmail">
              SRM College Email
            </Label>
            <p className="text-xs text-muted-foreground">
              This email is shown in the order modals instructing users where to send file attachments.
            </p>
            <Input
              id="srmCollegeEmail"
              type="email"
              placeholder="e.g. srmxerox@srmist.edu.in"
              value={srmCollegeEmail}
              onChange={(e) => setSrmCollegeEmail(e.target.value)}
              disabled={!isEditing}
              className="font-medium focus-visible:ring-indigo-500"
            />
          </div>

          {isEditing && (
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex items-center gap-1.5"
                disabled={saving}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
                loading={saving}
                loadingText="Saving..."
              >
                <Save className="h-3.5 w-3.5" />
                Save Config
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
