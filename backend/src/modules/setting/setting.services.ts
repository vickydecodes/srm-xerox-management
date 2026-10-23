import Setting from '@db/models/setting.model.ts';

export const getSettings = async (shopId?: string | null) => {
  let settings = null;
  if (shopId) {
    settings = await Setting.findOne({ shop: String(shopId) });
  }

  // Fall back to global default settings
  if (!settings) {
    settings = await Setting.findOne({ shop: null });
  }

  // If still not found, check any existing setting
  if (!settings) {
    settings = await Setting.findOne({});
  }

  // Create initial default setting if none exists
  if (!settings) {
    settings = await new Setting({
      shop: null,
      srmCollegeEmail: 'srmxerox@srmist.edu.in',
      pdfTitle: 'THE REPROGRAPHICS CENTRE',
      pdfPaperSize: 'A5 Landscape',
      pdfMargin: 30,
      pdfLogoSize: 45,
      pdfCustomWidth: 80,
      pdfCustomHeight: 200,
    }).save();
  }

  return settings;
};

export const updateSettings = async (data: any, shopId?: string | null) => {
  const targetShop = shopId !== undefined ? shopId : (data.shop ?? null);
  const query = targetShop ? { shop: String(targetShop) } : { shop: null };
  const payload: any = { ...data };
  if (targetShop) {
    payload.shop = String(targetShop);
  } else {
    payload.shop = null;
  }

  const settings = await Setting.findOneAndUpdate(
    query,
    { $set: payload },
    { new: true, upsert: true }
  );
  return settings;
};
