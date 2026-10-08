import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

const proofFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error: any = new Error(
      'Invalid file type. Only PDF and Image files (JPEG, PNG, WEBP) are allowed.'
    );
    error.statusCode = 400;
    cb(error);
  }
};

export const proofUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: proofFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});


