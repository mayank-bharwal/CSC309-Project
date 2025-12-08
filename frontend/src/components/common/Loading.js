const Loading = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} border-2 border-gray-200 border-t-brand-500 rounded-full animate-spin dark:border-gray-700 dark:border-t-brand-400`}
      />
    </div>
  );
};

export default Loading;

