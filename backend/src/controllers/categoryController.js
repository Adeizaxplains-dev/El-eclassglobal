import { catchAsync } from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';
import * as categoryService from '../services/categoryService.js';

export const listCategories = catchAsync(async (req, res) => {
  const categories = await categoryService.listCategories({ status: req.query.status });
  sendSuccess(res, { data: categories });
});

export const getCategory = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  sendSuccess(res, { data: category });
});

export const createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  sendSuccess(res, { data: category, statusCode: 201, message: 'Category created' });
});

export const updateCategory = catchAsync(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  sendSuccess(res, { data: category, message: 'Category updated' });
});

export const deleteCategory = catchAsync(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  sendSuccess(res, { message: 'Category deactivated' });
});
