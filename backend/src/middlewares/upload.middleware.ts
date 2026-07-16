import multer from 'multer';

// Store uploaded files in memory (buffer) for processing without writing to disk
export const upload = multer({ storage: multer.memoryStorage() });
