const Select = ({
  label,
  options,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 dark:bg-gray-800 ${
          error
            ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500/20 dark:border-red-600 dark:text-red-400'
            : 'border-gray-300 text-gray-900 focus:border-brand-500 focus:ring-brand-500/20 dark:border-gray-600 dark:text-white'
        }`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Select;

