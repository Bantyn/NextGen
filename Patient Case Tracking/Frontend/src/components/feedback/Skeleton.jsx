import React from 'react';

/**
 * Skeleton Loader Component
 */
export const Skeleton = ({
  variant = 'text', // 'text' | 'card' | 'circle' | 'button'
  width,
  height,
  className = '',
}) => {
  const baseStyles =
    'animate-pulse bg-slate-800/40 dark:bg-slate-800/60 border border-slate-700/20';

  const variantStyles = {
    text: 'h-4 w-full rounded-md',
    card: 'h-32 w-full rounded-2xl',
    circle: 'h-10 w-10 rounded-full',
    button: 'h-10 w-28 rounded-xl',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant] || ''} ${className}`}
      style={style}
    />
  );
};

export default Skeleton;
