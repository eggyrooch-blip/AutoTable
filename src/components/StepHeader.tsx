import React from 'react';

export type StepHeaderProps = {
  step: string;
  title: string;
  hint?: React.ReactNode;
  action?: React.ReactNode;
};

export default function StepHeader({ step, title, hint, action }: StepHeaderProps) {
  return (
    <div className="step-header">
      <div className="step-header__meta">
        <span className="step-header__step" aria-hidden="true">
          {step}
        </span>
        <div className="step-header__text">
          <h2 className="step-header__title">{title}</h2>
          {hint ? <p className="step-header__hint">{hint}</p> : null}
        </div>
      </div>
      {action ? <div className="step-header__action">{action}</div> : null}
    </div>
  );
}
