import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import LoginForm from '../components/LoginForm';

expect.extend(toHaveNoViolations);

describe('Accessibility (a11y) checks', () => {
  it('LoginForm has no detectable a11y violations', async () => {
    const { container } = render(<LoginForm onLogin={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
