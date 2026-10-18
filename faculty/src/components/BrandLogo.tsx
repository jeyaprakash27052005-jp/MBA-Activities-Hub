import React, { useState } from 'react';

// Shows /logo.png (put the college logo at public/logo.png). Falls back to the given icon if the file is missing.
export const BrandLogo: React.FC<{ className?: string; fallback: React.ReactNode }> = ({ className = 'h-10 w-auto', fallback }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  return <img src="/logo.png" alt="College logo" className={className} onError={() => setFailed(true)} />;
};
