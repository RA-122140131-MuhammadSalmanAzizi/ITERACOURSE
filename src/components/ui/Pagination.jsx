import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import './Pagination.css';

export const Pagination = ({ className = '', ...props }) => (
    <nav
        role="navigation"
        aria-label="pagination"
        className={`pagination-nav ${className}`}
        {...props}
    />
);

export const PaginationContent = ({ className = '', ...props }) => (
    <ul className={`pagination-content ${className}`} {...props} />
);

export const PaginationItem = ({ className = '', ...props }) => (
    <li className={`pagination-item ${className}`} {...props} />
);

export const PaginationLink = ({
    className = '',
    isActive,
    size = 'icon',
    ...props
}) => (
    <a
        aria-current={isActive ? 'page' : undefined}
        className={`pagination-link ${isActive ? 'active' : ''} size-${size} ${className}`}
        {...props}
    />
);

export const PaginationPrevious = ({
    className = '',
    ...props
}) => (
    <PaginationLink
        aria-label="Go to previous page"
        size="default"
        className={`pagination-prev ${className}`}
        {...props}
    >
        <ChevronLeft size={16} />
        <span>Previous</span>
    </PaginationLink>
);

export const PaginationNext = ({
    className = '',
    ...props
}) => (
    <PaginationLink
        aria-label="Go to next page"
        size="default"
        className={`pagination-next ${className}`}
        {...props}
    >
        <span>Next</span>
        <ChevronRight size={16} />
    </PaginationLink>
);

export const PaginationEllipsis = ({ className = '', ...props }) => (
    <span
        aria-hidden
        className={`pagination-ellipsis ${className}`}
        {...props}
    >
        <MoreHorizontal size={16} />
        <span className="sr-only">More pages</span>
    </span>
);
