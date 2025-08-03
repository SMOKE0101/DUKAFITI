import React from 'react';
import { useProductTemplates } from '../hooks/useProductTemplates';

const DebugTemplateGrid: React.FC = () => {
  const { templates, loading, error, totalTemplates } = useProductTemplates();
  
  console.log('[DebugTemplateGrid] Templates loaded:', {
    totalTemplates,
    templatesLength: templates.length,
    loading,
    error,
    firstTemplate: templates[0],
    firstFewTemplates: templates.slice(0, 5)
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Template Debug ({templates.length} templates)</h2>
      <div className="grid grid-cols-2 gap-4">
        {templates.slice(0, 10).map((template) => (
          <div key={template.id} className="border p-2 rounded">
            <h3 className="font-semibold">{template.name}</h3>
            <p className="text-sm text-gray-600">{template.category}</p>
            <p className="text-xs text-gray-500">ID: {template.id}</p>
            <div className="mt-2">
              <p className="text-xs">Image URL:</p>
              <p className="text-xs break-all bg-gray-100 p-1 rounded">{template.image_url || 'No image'}</p>
              {template.image_url && (
                <img 
                  src={template.image_url} 
                  alt={template.name}
                  className="w-20 h-20 object-cover mt-2 border rounded"
                  onLoad={() => console.log('[DebugTemplateGrid] Image loaded:', template.image_url)}
                  onError={() => console.log('[DebugTemplateGrid] Image error:', template.image_url)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugTemplateGrid;