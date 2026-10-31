export const compressImage = (file: File, maxSize = 256): Promise<Blob> => new Promise((resolve, reject) => {
  const image = new Image();
  const reader = new FileReader();
  reader.onload = () => { image.src = String(reader.result); };
  reader.onerror = () => reject(new Error('Не удалось прочитать изображение'));
  image.onload = () => {
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext('2d');
    if (!context) { reject(new Error('Браузер не поддерживает обработку изображения')); return; }
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Не удалось сжать изображение')), 'image/jpeg', 0.82);
  };
  image.onerror = () => reject(new Error('Файл не является изображением'));
  reader.readAsDataURL(file);
});
