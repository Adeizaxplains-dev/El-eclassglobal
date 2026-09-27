import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { uploadProductImage } from '../integrations/cloudinary/cloudinaryService.js';

export const uploadImage = catchAsync(async (req, res) => {
  const result = await uploadProductImage(req.body.dataUri);

  sendSuccess(res, {
    data: result,
    statusCode: 201,
    message: 'Image uploaded',
  });
});