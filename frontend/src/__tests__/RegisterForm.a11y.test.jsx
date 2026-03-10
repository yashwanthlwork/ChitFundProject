import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import RegisterForm from '../components/RegisterForm';

expect.extend(toHaveNoViolations);

describe('Accessibility (a11y) checks', () => {
  it('RegisterForm has no detectable a11y violations', async () => {
    const { container } = render(<RegisterForm onRegister={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
