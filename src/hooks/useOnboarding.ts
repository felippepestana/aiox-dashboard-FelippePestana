'use client';

import { useState } from 'react';

export function useOnboarding() {
  const [isCompleted, setIsCompleted] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('apex_onboarding_completed') === 'true';
  });

  const markCompleted = () => {
    localStorage.setItem('apex_onboarding_completed', 'true');
    setIsCompleted(true);
  };

  const reset = () => {
    localStorage.removeItem('apex_onboarding_completed');
    setIsCompleted(false);
  };

  return { isCompleted, shouldShow: !isCompleted, markCompleted, reset };
}
