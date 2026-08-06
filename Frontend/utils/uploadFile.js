import { Platform } from 'react-native';

// React Native's fetch polyfill lets FormData.append('field', { uri, type, name })
// stand in for a real file — that shorthand doesn't exist in the browser's actual
// FormData, so on web the object is silently dropped and no file ever reaches the
// server. Fetch the uri into a real Blob on web instead; keep the RN shorthand on
// native, where it already works.
export async function appendImageToFormData(formData, fieldName, uri, filename) {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append(fieldName, blob, filename);
    return;
  }
  formData.append(fieldName, { uri, type: 'image/jpeg', name: filename });
}
