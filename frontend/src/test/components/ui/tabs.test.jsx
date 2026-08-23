import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

describe('Tabs', () => {
  it('renders triggers and content', () => {
    render(
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">Content One</TabsContent>
        <TabsContent value="two">Content Two</TabsContent>
      </Tabs>
    );
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Content One')).toBeInTheDocument();
  });
});