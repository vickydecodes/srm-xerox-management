import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/core/contexts/api.context';
import { Save, X, RefreshCw, FileText, Settings as SettingsIcon } from 'lucide-react';
import { apiurls } from '@/core/api/api.urls';
import axios from 'axios';

export default function Settings() {
  const { settings } = useApi();

  const [srmCollegeEmail, setSrmCollegeEmail] = useState("");
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfPaperSize, setPdfPaperSize] = useState("A5 Landscape");
  const [pdfMargin, setPdfMargin] = useState(30);
  const [pdfLogoSize, setPdfLogoSize] = useState(45);

  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (settings) {
      settings.fetch();
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const loadDefaults = () => {
    if (settings?.config) {
      setSrmCollegeEmail(settings.config.srmCollegeEmail ?? "");
      setPdfTitle(settings.config.pdfTitle ?? "SRM Xerox & DTP Management");
      setPdfPaperSize(settings.config.pdfPaperSize ?? "A5 Landscape");
      setPdfMargin(settings.config.pdfMargin ?? 30);
      setPdfLogoSize(settings.config.pdfLogoSize ?? 45);
    }
  };

  useEffect(() => {
    loadDefaults();
  }, [settings?.config]);

  const isDirty =
    srmCollegeEmail !== (settings?.config?.srmCollegeEmail ?? "") ||
    pdfTitle !== (settings?.config?.pdfTitle ?? "SRM Xerox & DTP Management") ||
    pdfPaperSize !== (settings?.config?.pdfPaperSize ?? "A5 Landscape") ||
    Number(pdfMargin) !== (settings?.config?.pdfMargin ?? 30) ||
    Number(pdfLogoSize) !== (settings?.config?.pdfLogoSize ?? 45);

  const loadPreview = async () => {
    setPreviewLoading(true);
    try {
      const response = await axios.post(
        apiurls.settings.previewPdf.url(),
        {
          srmCollegeEmail,
          pdfTitle,
          pdfPaperSize,
          pdfMargin: Number(pdfMargin) || 30,
          pdfLogoSize: Number(pdfLogoSize) || 45,
        },
        {
          withCredentials: true,
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Failed to load PDF preview", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadPreview();
    }, 800);
  }, [pdfTitle, pdfPaperSize, pdfMargin, pdfLogoSize]);

  const handleSave = async () => {
    if (!srmCollegeEmail.trim() || !pdfTitle.trim()) return;
    setSaving(true);
    try {
      await settings.update({
        srmCollegeEmail: srmCollegeEmail.trim(),
        pdfTitle: pdfTitle.trim(),
        pdfPaperSize,
        pdfMargin: Number(pdfMargin),
        pdfLogoSize: Number(pdfLogoSize),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
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

  const isReadonly = !settings?.allowEdit;

  return (
    <div className="flex flex-col">


      <Tabs defaultValue="general" className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex flex-col shrink-0">
          <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 space-y-1">
            <TabsTrigger
              value="general"
              className="w-full justify-start px-4 py-2.5 text-sm font-medium rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-muted/50"
            >
              <SettingsIcon className="w-4 h-4 mr-3 shrink-0" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="invoice"
              className="w-full justify-start px-4 py-2.5 text-sm font-medium rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-muted/50"
            >
              <FileText className="w-4 h-4 mr-3 shrink-0" />
              Invoice Layout
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-w-0">
          <TabsContent value="general" className="mt-0 outline-none">
            <Card>
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg">General Configuration</CardTitle>
                <CardDescription>Basic settings for the Xerox management system.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold" htmlFor="srmCollegeEmail">
                    SRM College Official Email
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    This email is shown in the order modals, instructing users where to securely send file attachments for printing.
                  </p>
                  <Input
                    id="srmCollegeEmail"
                    type="email"
                    placeholder="e.g. srmxerox@srmist.edu.in"
                    value={srmCollegeEmail}
                    onChange={(e) => setSrmCollegeEmail(e.target.value)}
                    disabled={isReadonly}
                    className="font-medium max-w-md"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoice" className="mt-0 outline-none">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Column - Form */}
              <Card className="h-fit">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle className="text-lg">Layout Editor</CardTitle>
                  <CardDescription>Customize how the generated bills and invoices look.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold" htmlFor="pdfTitle">
                      Invoice Heading
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      This bold title is printed at the top left corner of the generated invoices.
                    </p>
                    <Input
                      id="pdfTitle"
                      type="text"
                      placeholder="e.g. SRM Xerox & DTP Management"
                      value={pdfTitle}
                      onChange={(e) => setPdfTitle(e.target.value)}
                      disabled={isReadonly}
                      className="font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Paper Format
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Controls the sizing of the PDF bills. Choose A5 for receipt printers.
                    </p>
                    <Select
                      disabled={isReadonly}
                      value={pdfPaperSize}
                      onValueChange={setPdfPaperSize}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select paper size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A4 Portrait">A4 Portrait (Standard Document)</SelectItem>
                        <SelectItem value="A5 Portrait">A5 Portrait (Half A4)</SelectItem>
                        <SelectItem value="A5 Landscape">A5 Landscape (Horizontal)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">
                        Border Margin (px)
                      </Label>
                      <Input
                        type="number"
                        value={pdfMargin}
                        onChange={(e) => setPdfMargin(e.target.value)}
                        disabled={isReadonly}
                        className="font-medium"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">
                        Logo Size (px)
                      </Label>
                      <Input
                        type="number"
                        value={pdfLogoSize}
                        onChange={(e) => setPdfLogoSize(e.target.value)}
                        disabled={isReadonly}
                        className="font-medium"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column - Preview */}
              <Card className="h-[600px] flex flex-col overflow-hidden">
                <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between pb-4 space-y-0">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <FileText className="w-4 h-4" /> Live Preview
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 -my-2"
                    onClick={loadPreview}
                    disabled={previewLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${previewLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardHeader>
                <CardContent className="p-0 flex-1 relative bg-muted/10">
                  {previewLoading && !previewUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">Rendering PDF...</span>
                      </div>
                    </div>
                  )}

                  {previewUrl ? (
                    <iframe
                      src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                      className="w-full h-full border-0 absolute inset-0 pointer-events-none"
                      title="Invoice Preview"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <p className="animate-pulse">Waiting for preview...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Save Action Bar */}
      {isDirty && !isReadonly && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-background border shadow-xl rounded-full px-6 py-4 flex items-center gap-6">
            <span className="text-sm font-medium whitespace-nowrap text-foreground">
              You have unsaved changes
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadDefaults}
                disabled={saving}
                className="rounded-full px-4"
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                loading={saving}
                loadingText="Saving"
                className="rounded-full px-6"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
