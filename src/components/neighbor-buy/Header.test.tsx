import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

// Mock Next.js Link component
jest.mock('next/link', () => {
  function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  }
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'lang' ? 'cn' : null),
  }),
}));

describe('Header component', () => {
  it('should render the neighborhood name', () => {
    render(<Header />);
    const titleElement = screen.getByText(/Oslo/i);
    expect(titleElement).toBeInTheDocument();
  });

  it('should render the notifications button', () => {
    render(<Header />);
    const buttonElement = screen.getByRole('button', { name: /Varsler/i });
    expect(buttonElement).toBeInTheDocument();
  });
});
