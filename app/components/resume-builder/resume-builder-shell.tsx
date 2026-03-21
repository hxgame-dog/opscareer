'use client';

import type { ReactNode } from 'react';

type ResumeBuilderShellProps = {
  left: ReactNode;
  right: ReactNode;
};

export function ResumeBuilderShell({ left, right }: ResumeBuilderShellProps) {
  return (
    <div className="resume-builder-layout">
      <div className="resume-builder-left">{left}</div>
      <div className="resume-builder-right">{right}</div>
    </div>
  );
}
