import Setting from '@db/models/setting.model.ts';

export const getSettings = async () => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await new Setting({
      srmCollegeEmail: 'srmxerox@srmist.edu.in'
    }).save();
  }
  return settings;
};

export const updateSettings = async (data: { srmCollegeEmail: string }) => {
  let settings = await Setting.findOneAndUpdate(
    {},
    { $set: data },
    { new: true, upsert: true }
  );
  return settings;
};
