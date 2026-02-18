import { BlogPost } from '../modules/blog/types';

export const mockBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Getting Started with Modern Web Development',
    slug: 'getting-started-modern-web-dev',
    excerpt: 'Learn the fundamentals of modern web development with React, TypeScript, and Tailwind CSS.',
    content: `# Getting Started with Modern Web Development

Modern web development has evolved significantly over the past few years. In this guide, we'll explore the essential tools and frameworks that power today's web applications.

## Why React?

React has become the de facto standard for building user interfaces. Its component-based architecture and virtual DOM make it incredibly efficient and developer-friendly.

## TypeScript Benefits

TypeScript adds static typing to JavaScript, helping you catch errors early and write more maintainable code.

## Tailwind CSS

Tailwind CSS is a utility-first CSS framework that speeds up development and keeps your styles consistent.`,
    tags: ['react', 'typescript', 'tutorial'],
    status: 'published',
    featuredImage: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    publishedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'Building Scalable APIs with Node.js',
    slug: 'building-scalable-apis-nodejs',
    excerpt: 'Best practices for designing and implementing scalable RESTful APIs.',
    content: `# Building Scalable APIs with Node.js

Creating a robust and scalable API is crucial for modern applications. Let's explore best practices.

## Architecture Patterns

- **Layered Architecture**: Separate concerns into controllers, services, and repositories
- **Middleware Pattern**: Use middleware for cross-cutting concerns
- **Error Handling**: Centralized error handling for consistency

## Performance Optimization

- Implement caching strategies
- Use connection pooling
- Optimize database queries

## Security

Always validate input, use rate limiting, and implement proper authentication.`,
    tags: ['nodejs', 'api', 'backend'],
    status: 'published',
    featuredImage: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-22'),
    publishedAt: new Date('2024-01-22'),
  },
  {
    id: '3',
    title: 'Advanced State Management Patterns',
    slug: 'advanced-state-management-patterns',
    excerpt: 'Explore different approaches to managing application state in React applications.',
    content: `# Advanced State Management Patterns

State management is one of the most challenging aspects of building React applications. Let's dive into various patterns and when to use them.

## Context API

Perfect for simple global state that doesn't change frequently.

## Zustand

A lightweight alternative to Redux with a simpler API and less boilerplate.

## Redux Toolkit

The modern way to use Redux, with sensible defaults and less configuration.`,
    tags: ['react', 'state-management', 'zustand'],
    status: 'draft',
    featuredImage: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '4',
    title: 'CSS Grid vs Flexbox: When to Use Each',
    slug: 'css-grid-vs-flexbox',
    excerpt: 'Understanding the differences and use cases for CSS Grid and Flexbox layouts.',
    content: `# CSS Grid vs Flexbox: When to Use Each

Both CSS Grid and Flexbox are powerful layout tools, but they excel in different scenarios.

## Flexbox

Best for one-dimensional layouts:
- Navigation bars
- Card layouts
- Centering elements

## CSS Grid

Perfect for two-dimensional layouts:
- Page layouts
- Image galleries
- Dashboard layouts

## Combining Both

The most powerful layouts use both technologies together.`,
    tags: ['css', 'layout', 'design'],
    status: 'published',
    featuredImage: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    publishedAt: new Date('2024-02-10'),
  },
  {
    id: '5',
    title: 'Optimizing React Performance',
    slug: 'optimizing-react-performance',
    excerpt: 'Techniques and best practices for building fast and efficient React applications.',
    content: `# Optimizing React Performance

Performance optimization is crucial for delivering great user experiences. Here are key strategies.

## Memoization

Use \`React.memo\`, \`useMemo\`, and \`useCallback\` to prevent unnecessary re-renders.

## Code Splitting

Lazy load components and routes to reduce initial bundle size.

## Virtual Lists

For long lists, use virtualization to render only visible items.

## Profiling

Always measure before optimizing using React DevTools Profiler.`,
    tags: ['react', 'performance', 'optimization'],
    status: 'draft',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-16'),
  },
];
