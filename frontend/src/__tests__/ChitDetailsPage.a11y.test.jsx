import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ChitDetailsPage from '../components/ChitDetailsPage';

expect.extend(toHaveNoViolations);

describe('Accessibility (a11y) checks', () => {
  it('ChitDetailsPage has no detectable a11y violations', async () => {
    // Provide required props for ChitDetailsPage
    const { container } = render(<ChitDetailsPage chitId={1} onBack={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
