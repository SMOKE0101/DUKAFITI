import React from 'react';
import ExternalProductImage from './external-product-image';

const ImageTest: React.FC = () => {
  // Test with known working template image URL
  const testImageUrl = "https://cdn.quickmart.co.ke/resized/230_230/product_images_510160.png?t=1753915240";
  
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Image Loading Test</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
          <ExternalProductImage
            src={testImageUrl}
            alt="Kabras Sugar White 2Kg"
            productName="Kabras Sugar White 2Kg"
            className="w-full h-full"
            size="md"
          />
        </div>
        <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
          <ExternalProductImage
            src="https://invalid-url-test.com/image.png"
            alt="Invalid Image Test"
            productName="Invalid Image Test"
            className="w-full h-full"
            size="md"
          />
        </div>
        <div className="w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
          <ExternalProductImage
            src={null}
            alt="No Image Test"
            productName="No Image Test"
            className="w-full h-full"
            size="md"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageTest;