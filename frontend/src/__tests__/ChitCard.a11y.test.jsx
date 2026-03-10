import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ChitCard from '../components/ChitCard';

expect.extend(toHaveNoViolations);

describe('Accessibility (a11y) checks', () => {
  it('ChitCard has no detectable a11y violations', async () => {
    const { container } = render(<ChitCard chit={{ id: 1, name: 'Test Chit', adminUsername: 'admin', members: [], sessions: [] }} onClick={() => {}} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
