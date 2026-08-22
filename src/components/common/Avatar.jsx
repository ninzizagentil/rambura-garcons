function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
};

export default function Avatar({ name, src, size = 'md', className = '' }) {
  const sizeClasses = SIZES[size] || SIZES.md;

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s profile photo` : 'Profile photo'}
        className={`${sizeClasses} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <span
      className={`${sizeClasses} rounded-full bg-[var(--color-medium-green)] text-white flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
