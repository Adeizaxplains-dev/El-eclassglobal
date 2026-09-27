import { api } from './api.js';

function readFileAsDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected file'));
    reader.readAsDataURL(file);
  });
}

export async function uploadProductImage(file) {
  const dataUri = await readFileAsDataUri(file);
  return api.post('/products/admin/upload-image', { dataUri }).then((r) => r.data);
}
