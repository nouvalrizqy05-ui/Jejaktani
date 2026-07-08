import React from 'react';

export default function PasswordStrength({ password }) {
  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-stone-200' };
    
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score, label: 'Lemah', color: 'bg-red-500' };
    if (score === 3) return { score, label: 'Sedang', color: 'bg-yellow-500' };
    if (score === 4) return { score, label: 'Kuat', color: 'bg-leaf-500' };
    return { score, label: 'Sangat Kuat', color: 'bg-teal-600' };
  };

  const strength = calculateStrength(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1.5 w-full">
        <div className={`flex-1 rounded-full ${password.length > 0 ? (strength.score >= 1 ? strength.color : 'bg-red-500') : 'bg-stone-200'}`}></div>
        <div className={`flex-1 rounded-full ${password.length > 0 && strength.score >= 3 ? strength.color : 'bg-stone-200'}`}></div>
        <div className={`flex-1 rounded-full ${password.length > 0 && strength.score >= 4 ? strength.color : 'bg-stone-200'}`}></div>
        <div className={`flex-1 rounded-full ${password.length > 0 && strength.score >= 5 ? strength.color : 'bg-stone-200'}`}></div>
      </div>
      {strength.label && (
        <p className={`text-xs mt-1 font-medium ${strength.color.replace('bg-', 'text-')}`}>
          Kekuatan: {strength.label}
        </p>
      )}
    </div>
  );
}
