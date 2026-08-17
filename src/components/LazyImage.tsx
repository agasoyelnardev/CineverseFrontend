import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  placeholderColor?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  placeholderColor = 'bg-zinc-800/80',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName || 'w-full h-full'}`}>
      {/* Blurred background & Skeleton Placeholder */}
      {!isLoaded && !hasError && (
        <div className={`absolute inset-0 ${placeholderColor} animate-pulse flex items-center justify-center overflow-hidden z-0`}>
          {/* Blurred background thumbnail representation */}
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-xl scale-125 opacity-60"
            style={{ backgroundImage: `url(${src})` }}
          />
          {/* Shimmer / Skeleton overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
        </div>
      )}

      {/* Error fallback */}
      {hasError ? (
        <div className={`absolute inset-0 ${placeholderColor} flex flex-col items-center justify-center p-2 text-zinc-500 text-center z-10`}>
          <ImageIcon className="w-8 h-8 mb-1 opacity-40" />
          <span className="text-[10px] font-medium opacity-60">Şəkil yüklənmədi</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
  console.error('❌ LazyImage image error');
  console.error('SRC:', src);
  console.error('ALT:', alt);
  console.error('CURRENT SRC:', e.currentTarget.src);

  setHasError(true);
}}
          className={`w-full h-full object-cover transition-all duration-500 ease-out ${
            isLoaded ? 'opacity-100 filter-none scale-100' : 'opacity-0 filter blur-md scale-105'
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
