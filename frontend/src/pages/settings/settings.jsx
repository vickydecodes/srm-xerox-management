import React, { useState, useEffect, useRef, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/core/contexts/api.context';
import { AuthContext } from '@/core/contexts/auth.context';
import { Save, X, RefreshCw, FileText, Settings as SettingsIcon, Store, Printer, Sliders } from 'lucide-react';
import { apiurls } from '@/core/api/api.urls';
import axios from 'axios';

const defaultPdfTitle = 'THE REPROGRAPHICS CENTRE';
const previousDefaultPdfTitle = 'SRM Xerox & DTP Management';

export default function Settings() {
  const { settings, shops } = useApi();
  const auth = useContext(AuthContext);
  const user = auth?.user;

  const isSuperAdmin = user?.role === 'super_admin';
  const userShopId = user?.shop
    ? (typeof user.shop === 'object' ? user.shop._id || user.shop.id : String(user.shop))
    : null;

  // Selected shop to configure
  const [selectedShop, setSelectedShop] = useState(isSuperAdmin ? 'global' : (userShopId || 'global'));

  const [srmCollegeEmail, setSrmCollegeEmail] = useState("");
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfPaperSize, setPdfPaperSize] = useState("A5 Landscape");
  const [pdfMargin, setPdfMargin] = useState(30);
  const [pdfLogoSize, setPdfLogoSize] = useState(45);
  const [pdfCustomWidth, setPdfCustomWidth] = useState(80);
  const [pdfCustomHeight, setPdfCustomHeight] = useState(200);

  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const debounceRef = useRef(null);

  // Fetch shops for super admin
  useEffect(() => {
    if (isSuperAdmin && shops?.fetch) {
      shops.fetch();
    }
  }, [isSuperAdmin]);

  // Fetch settings for the active shop context
  useEffect(() => {
    if (settings) {
      const shopArg = selectedShop === 'global' ? null : selectedShop;
      settings.fetch(shopArg);
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [selectedShop]);

  const loadDefaults = () => {
    if (settings?.config) {
      setSrmCollegeEmail(settings.config.srmCollegeEmail ?? "");
      const savedPdfTitle = settings.config.pdfTitle;
      setPdfTitle(!savedPdfTitle || savedPdfTitle === previousDefaultPdfTitle ? defaultPdfTitle : savedPdfTitle);
      setPdfPaperSize(settings.config.pdfPaperSize ?? "A5 Landscape");
      setPdfMargin(settings.config.pdfMargin ?? 30);
      setPdfLogoSize(settings.config.pdfLogoSize ?? 45);
      setPdfCustomWidth(settings.config.pdfCustomWidth ?? 80);
      setPdfCustomHeight(settings.config.pdfCustomHeight ?? 200);
    }
  };

  useEffect(() => {
    loadDefaults();
  }, [settings?.config]);

  const isDirty =
    srmCollegeEmail !== (settings?.config?.srmCollegeEmail ?? "") ||
    pdfTitle !== (settings?.config?.pdfTitle === previousDefaultPdfTitle
      ? defaultPdfTitle
      : settings?.config?.pdfTitle ?? defaultPdfTitle) ||
    pdfPaperSize !== (settings?.config?.pdfPaperSize ?? "A5 Landscape") ||
    Number(pdfMargin) !== (settings?.config?.pdfMargin ?? 30) ||
    Number(pdfLogoSize) !== (settings?.config?.pdfLogoSize ?? 45) ||
    Number(pdfCustomWidth) !== (settings?.config?.pdfCustomWidth ?? 80) ||
    Number(pdfCustomHeight) !== (settings?.config?.pdfCustomHeight ?? 200);

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
          pdfCustomWidth: Number(pdfCustomWidth) || 80,
          pdfCustomHeight: Number(pdfCustomHeight) || 200,
          shop: selectedShop === 'global' ? null : selectedShop,
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
  }, [pdfTitle, pdfPaperSize, pdfMargin, pdfLogoSize, pdfCustomWidth, pdfCustomHeight, selectedShop]);

  const handleSave = async () => {
    if (!srmCollegeEmail.trim() || !pdfTitle.trim()) return;
    setSaving(true);
    try {
      const shopArg = selectedShop === 'global' ? null : selectedShop;
      await settings.update({
        srmCollegeEmail: srmCollegeEmail.trim(),
        pdfTitle: pdfTitle.trim(),
        pdfPaperSize,
        pdfMargin: Number(pdfMargin),
        pdfLogoSize: Number(pdfLogoSize),
        pdfCustomWidth: Number(pdfCustomWidth),
        pdfCustomHeight: Number(pdfCustomHeight),
        shop: shopArg,
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

  // Find current shop object if assigned
  const shopList = shops?.state || [];
  const currentShopObj = shopList.find(
    (s) => (s._id || s.id) === (selectedShop === 'global' ? null : selectedShop)
  );

  return (
    <div className="flex flex-col space-y-6">
      {/* Top Banner: Shop Adaptation Selector */}
      <Card className="border bg-card/70 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">Shop Configuration Scope</h3>
                {selectedShop === 'global' ? (
                  <Badge variant="outline" className="text-xs font-medium bg-muted/50">
                    Global Default
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-xs font-medium bg-primary">
                    Shop Specific
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSuperAdmin
                  ? "Select a shop to adapt its unique billing format, receipt sizing (80mm/110mm/A4/A5), and margins."
                  : `Configuring bill sizing and format tailored specifically for ${currentShopObj?.name || 'your assigned counter'}.`}
              </p>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label className="text-xs font-semibold whitespace-nowrap text-muted-foreground">
                Target Shop:
              </Label>
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger className="w-full sm:w-64 h-9 font-medium text-xs">
                  <SelectValue placeholder="Select Shop Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">
                    🌐 Global Default (All Shops)
                  </SelectItem>
                  {shopList.map((shop) => (
                    <SelectItem key={shop._id || shop.id} value={shop._id || shop.id}>
                      🏪 {shop.name} ({shop.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="general" className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex flex-col shrink-0">
          <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 space-y-1">
            <TabsTrigger
              value="general"
              className="w-full justify-start px-4 py-2.5 text-sm font-medium rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-muted/50"
            >
              <SettingsIcon className="w-4 h-4 mr-3 shrink-0" />
              General Configuration
            </TabsTrigger>
            <TabsTrigger
              value="invoice"
              className="w-full justify-start px-4 py-2.5 text-sm font-medium rounded-md data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-muted/50"
            >
              <Printer className="w-4 h-4 mr-3 shrink-0" />
              Bill Format & Sizing
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Bill & Invoice Layout</CardTitle>
                      <CardDescription>
                        Configure 80mm/110mm thermal rolls, A4/A5 paper, or custom sizing.
                      </CardDescription>
                    </div>
                    {pdfPaperSize.includes('80mm') || pdfPaperSize.includes('110mm') ? (
                      <Badge variant="secondary" className="font-semibold text-xs bg-amber-500/10 text-amber-600 border-amber-200">
                        Thermal POS Slip
                      </Badge>
                    ) : pdfPaperSize === 'Custom' ? (
                      <Badge variant="secondary" className="font-semibold text-xs bg-purple-500/10 text-purple-600 border-purple-200">
                        Custom Dimensions
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-semibold text-xs bg-blue-500/10 text-blue-600 border-blue-200">
                        Document Invoice
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold" htmlFor="pdfTitle">
                      Invoice Heading / Shop Title
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      This bold title is printed at the top of generated invoices or thermal receipts.
                    </p>
                    <Input
                      id="pdfTitle"
                      type="text"
                      placeholder={defaultPdfTitle}
                      value={pdfTitle}
                      onChange={(e) => setPdfTitle(e.target.value)}
                      disabled={isReadonly}
                      className="font-medium"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Bill Sizing Option
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Select your printer standard. 80mm and 110mm are optimized for continuous thermal POS rolls.
                    </p>
                    <Select
                      disabled={isReadonly}
                      value={pdfPaperSize}
                      onValueChange={setPdfPaperSize}
                    >
                      <SelectTrigger className="w-full font-medium">
                        <SelectValue placeholder="Select billing size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="80mm">
                          🧾 80mm Thermal Receipt (Standard 3-inch POS Roll)
                        </SelectItem>
                        <SelectItem value="110mm">
                          🧾 110mm Wide Thermal Receipt (4-inch POS Roll)
                        </SelectItem>
                        <SelectItem value="A4 Portrait">
                          📄 A4 Portrait (Standard Corporate Document)
                        </SelectItem>
                        <SelectItem value="A4 Landscape">
                          📄 A4 Landscape (Horizontal Sheet)
                        </SelectItem>
                        <SelectItem value="A5 Landscape">
                          📋 A5 Landscape (Horizontal Half-Sheet)
                        </SelectItem>
                        <SelectItem value="A5 Portrait">
                          📋 A5 Portrait (Vertical Half-Sheet)
                        </SelectItem>
                        <SelectItem value="Custom">
                          📐 Custom Sizing (Enter Width & Height in mm)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Dimensions Fields */}
                  {pdfPaperSize === 'Custom' && (
                    <div className="p-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 space-y-4">
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                        <Sliders className="h-4 w-4" /> Custom Page Dimensions
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Width (mm)</Label>
                          <Input
                            type="number"
                            min="20"
                            max="500"
                            value={pdfCustomWidth}
                            onChange={(e) => setPdfCustomWidth(e.target.value)}
                            disabled={isReadonly}
                            className="font-medium"
                            placeholder="e.g. 80"
                          />
                          <p className="text-[11px] text-muted-foreground">Standard POS: 80mm</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Height (mm)</Label>
                          <Input
                            type="number"
                            min="20"
                            max="1000"
                            value={pdfCustomHeight}
                            onChange={(e) => setPdfCustomHeight(e.target.value)}
                            disabled={isReadonly}
                            className="font-medium"
                            placeholder="e.g. 200"
                          />
                          <p className="text-[11px] text-muted-foreground">Standard Roll: 200mm</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6 pt-2">
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">
                        Border Margin (px)
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={pdfMargin}
                        onChange={(e) => setPdfMargin(e.target.value)}
                        disabled={isReadonly}
                        className="font-medium"
                      />
                      <p className="text-xs text-muted-foreground">
                        {pdfPaperSize.includes('80mm') ? 'Recommended: 8 - 12 px' : 'Recommended: 20 - 40 px'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">
                        Logo Size (px)
                      </Label>
                      <Input
                        type="number"
                        min="5"
                        max="150"
                        value={pdfLogoSize}
                        onChange={(e) => setPdfLogoSize(e.target.value)}
                        disabled={isReadonly}
                        className="font-medium"
                      />
                      <p className="text-xs text-muted-foreground">
                        {pdfPaperSize.includes('80mm') ? 'Recommended: 28 - 36 px' : 'Recommended: 40 - 55 px'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column - Preview */}
              <Card className="h-[650px] flex flex-col overflow-hidden">
                <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between pb-4 space-y-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <FileText className="w-4 h-4 text-primary" /> Live Bill Preview
                    </CardTitle>
                    <Badge variant="outline" className="text-[11px] font-normal">
                      {pdfPaperSize}
                    </Badge>
                  </div>
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
                        <span className="text-sm font-medium text-muted-foreground">Rendering {pdfPaperSize} Preview...</span>
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
                      <p className="animate-pulse text-sm">Rendering preview for {pdfPaperSize}...</p>
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
              You have unsaved changes {selectedShop !== 'global' ? `for this shop` : `for global settings`}
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
