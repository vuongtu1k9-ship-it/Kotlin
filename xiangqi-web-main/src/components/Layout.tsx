import React from 'react';
import { SEO } from './SEO';
import { Header } from './Header';
import { Footer } from './Footer';

import { useInvitations } from '../hooks/useInvitations';

type LayoutProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export const Layout: React.FC<LayoutProps> = ({ title, description, children }) => {
  useInvitations();
  return (
    <>
      <SEO title={title} description={description} />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        {children}
      </main>
      <Footer />
    </>
  );
};
