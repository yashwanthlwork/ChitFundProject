import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Popup from '../components/Popup';

expect.extend(toHaveNoViolations);

describe('Accessibility (a11y) checks', () => {
  it('Popup has no detectable a11y violations', async () => {
    const { container } = render(<Popup open={true} message="Test message" onClose={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
