import { render, screen } from '@testing-library/react';
import { Header } from './Header';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('Header component', () => {
  it('should render the NeighborBuy title', () => {
    render(<Header />);
    const titleElement = screen.getByText(/NeighborBuy/i);
    expect(titleElement).toBeInTheDocument();
  });

  it('should have a link to the homepage', () => {
    render(<Header />);
    const linkElement = screen.getByRole('link', { name: /NeighborBuy/i });
    expect(linkElement).toHaveAttribute('href', '/');
  });

  it('should display the user avatar', () => {
    render(<Header />);
    const avatarImage = screen.getByAltText('User');
    expect(avatarImage).toBeInTheDocument();
    expect(avatarImage).toHaveAttribute('src', 'https://i.pravatar.cc/150?u=current-user');
  });
});
