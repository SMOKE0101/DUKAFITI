
import React from 'react';

interface CubeLogoProps {
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
}

const CubeLogo: React.FC<CubeLogoProps> = ({ size = 'md', isDark = false }) => {
  const dimensions = {
    sm: { size: 24, viewBox: '0 0 24 24' },
    md: { size: 32, viewBox: '0 0 32 32' },
    lg: { size: 40, viewBox: '0 0 40 40' }
  };

  const { size: svgSize, viewBox } = dimensions[size];
  
  // Colors for light and dark modes
  const cubeColor = isDark ? '#000000' : '#ffffff';
  const strokeColor = isDark ? '#ffffff' : '#e5e7eb';
  const accentColor = isDark ? '#6b7280' : '#9ca3af';

  return (
    <svg 
      width={svgSize} 
      height={svgSize} 
      viewBox={viewBox} 
      className="flex-shrink-0"
    >
      {/* Main cube faces */}
      <g transform="translate(4, 4)">
        {/* Top face */}
        <path
          d="M8 2 L16 6 L12 8 L4 4 Z"
          fill={cubeColor}
          stroke={strokeColor}
          strokeWidth="0.5"
        />
        
        {/* Left face */}
        <path
          d="M4 4 L12 8 L12 16 L4 12 Z"
          fill={accentColor}
          stroke={strokeColor}
          strokeWidth="0.5"
        />
        
        {/* Right face */}
        <path
          d="M12 8 L16 6 L16 14 L12 16 Z"
          fill={isDark ? '#374151' : '#f3f4f6'}
          stroke={strokeColor}
          strokeWidth="0.5"
        />
      </g>
    </svg>
  );
};

export default CubeLogo;
