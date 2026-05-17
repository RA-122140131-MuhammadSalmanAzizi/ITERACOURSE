import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, Filter, Star, Users, Clock, BookOpen,
    ChevronDown, Grid, List, X, GraduationCap
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import './CoursesPage.css';

const CoursesPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [priceFilter, setPriceFilter] = useState('all');
    const [sortBy, setSortBy] = useState('popular');
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

    useEffect(() => {
        loadData();
    }, []);

    // Prevent background scrolling when mobile filter is open
    useEffect(() => {
        if (showFilters) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showFilters]);

    const loadData = async () => {
        try {
            const [{ data: coursesData }, { data: catsData }] = await Promise.all([
                supabase
                    .from('courses')
                    .select('*, instructor:profiles!courses_instructor_id_fkey(full_name), category:categories(name)')
                    .eq('status', 'published')
                    .order('created_at', { ascending: false }),
                supabase.from('categories').select('*').order('name'),
            ]);
            setCourses(coursesData || []);
            setCategories(catsData || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (course.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || course.category?.name === selectedCategory;
        const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
        const matchesPrice = priceFilter === 'all' ||
            (priceFilter === 'free' && !course.price) ||
            (priceFilter === 'paid' && course.price > 0);

        return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
    });

    const sortedCourses = [...filteredCourses].sort((a, b) => {
        switch (sortBy) {
            case 'popular':
                return (b.enrollment_count || 0) - (a.enrollment_count || 0);
            case 'rating':
                return (b.avg_rating || 0) - (a.avg_rating || 0);
            case 'newest':
                return new Date(b.created_at) - new Date(a.created_at);
            case 'price-low':
                return (a.price || 0) - (b.price || 0);
            case 'price-high':
                return (b.price || 0) - (a.price || 0);
            default:
                return 0;
        }
    });

    const formatNumber = (num) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num;
    };

    const formatPrice = (price) => {
        if (price === 0) return 'Free';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedLevel('all');
        setPriceFilter('all');
        setSortBy('popular');
    };

    const hasActiveFilters = searchQuery || selectedCategory !== 'all' ||
        selectedLevel !== 'all' || priceFilter !== 'all';

    return (
        <div className="courses-page">
            <Navbar />

            <main className="courses-main">
                <div className="container">
                    {/* Page Header */}
                    <div className="page-header">
                        <div className="page-header-content">
                            <h1>All Courses</h1>
                            <p>Discover courses that will help you level up your skills</p>
                        </div>

                        <div className="search-bar">
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search for courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            {searchQuery && (
                                <button className="search-clear" onClick={() => setSearchQuery('')}>
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="courses-layout">
                        {/* Filters Sidebar */}
                        <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
                            <div className="filters-header">
                                <h3>Filters</h3>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {hasActiveFilters && (
                                        <button className="clear-filters" onClick={clearFilters}>
                                            Clear All
                                        </button>
                                    )}
                                    <button 
                                        className="close-filters-mobile" 
                                        onClick={() => setShowFilters(false)}
                                        aria-label="Close filters"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Category Filter */}
                            <div className="filter-group">
                                <h4>Category</h4>
                                <div className="filter-options">
                                    <label className="filter-option">
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={selectedCategory === 'all'}
                                            onChange={() => setSelectedCategory('all')}
                                        />
                                        <span>All Categories</span>
                                    </label>
                                    {categories.map(cat => (
                                        <label key={cat.id} className="filter-option">
                                            <input
                                                type="radio"
                                                name="category"
                                                checked={selectedCategory === cat.name}
                                                onChange={() => setSelectedCategory(cat.name)}
                                            />
                                            <span>{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Level Filter */}
                            <div className="filter-group">
                                <h4>Level</h4>
                                <div className="filter-options">
                                    <label className="filter-option">
                                        <input
                                            type="radio"
                                            name="level"
                                            checked={selectedLevel === 'all'}
                                            onChange={() => setSelectedLevel('all')}
                                        />
                                        <span>All Levels</span>
                                    </label>
                                    {levels.slice(1).map(level => (
                                        <label key={level} className="filter-option">
                                            <input
                                                type="radio"
                                                name="level"
                                                checked={selectedLevel === level}
                                                onChange={() => setSelectedLevel(level)}
                                            />
                                            <span>{level}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Price Filter */}
                            <div className="filter-group">
                                <h4>Price</h4>
                                <div className="filter-options">
                                    <label className="filter-option">
                                        <input
                                            type="radio"
                                            name="price"
                                            checked={priceFilter === 'all'}
                                            onChange={() => setPriceFilter('all')}
                                        />
                                        <span>All</span>
                                    </label>
                                    <label className="filter-option">
                                        <input
                                            type="radio"
                                            name="price"
                                            checked={priceFilter === 'free'}
                                            onChange={() => setPriceFilter('free')}
                                        />
                                        <span>Free</span>
                                    </label>
                                    <label className="filter-option">
                                        <input
                                            type="radio"
                                            name="price"
                                            checked={priceFilter === 'paid'}
                                            onChange={() => setPriceFilter('paid')}
                                        />
                                        <span>Paid</span>
                                    </label>
                                </div>
                            </div>
                        </aside>

                        {/* Courses Content */}
                        <div className="courses-content">
                            {/* Toolbar */}
                            <div className="courses-toolbar">
                                <div className="toolbar-left">
                                    <button
                                        className="filter-toggle btn btn-secondary"
                                        onClick={() => setShowFilters(!showFilters)}
                                    >
                                        <Filter size={18} />
                                        Filters
                                    </button>
                                    <div className="sort-dropdown">
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="sort-select"
                                        >
                                            <option value="popular">Most Popular</option>
                                            <option value="rating">Highest Rated</option>
                                            <option value="newest">Newest</option>
                                            <option value="price-low">Price: Low to High</option>
                                            <option value="price-high">Price: High to Low</option>
                                        </select>
                                        <ChevronDown size={16} className="sort-icon" />
                                    </div>
                                    <span className="results-count">
                                        {sortedCourses.length} courses found
                                    </span>
                                </div>

                                <div className="toolbar-right">

                                    <div className="view-toggle">
                                        <button
                                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                            onClick={() => setViewMode('grid')}
                                        >
                                            <Grid size={18} />
                                        </button>
                                        <button
                                            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                            onClick={() => setViewMode('list')}
                                        >
                                            <List size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Courses Grid/List */}
                            {sortedCourses.length > 0 ? (
                                <div className={`courses-grid ${viewMode}`}>
                                    {sortedCourses.map((course, index) => (
                                        <Link
                                            to={`/course/${course.id}`}
                                            key={course.id}
                                            className="course-card"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <div className="course-image">
                                                {course.thumbnail_url ? (
                                                    <img src={course.thumbnail_url} alt={course.title} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <BookOpen size={40} color="white" />
                                                    </div>
                                                )}
                                                <div className="course-badges">
                                                    <span className="badge badge-level">{course.level}</span>
                                                    <span className={`badge ${!course.price ? 'badge-free' : 'badge-premium'}`}>
                                                        {!course.price ? 'Free' : 'Premium'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="course-content">
                                                <div className="course-category">{course.category?.name || '-'}</div>
                                                <h3 className="course-title">{course.title}</h3>

                                                {viewMode === 'list' && (
                                                    <p className="course-description">{course.description}</p>
                                                )}

                                                <div className="course-instructor">
                                                    <div className="instructor-icon">
                                                        <GraduationCap size={16} />
                                                    </div>
                                                    <span>{course.instructor?.full_name || 'Instructor'}</span>
                                                </div>

                                                <div className="course-meta">
                                                    <div className="rating">
                                                        <Star size={14} fill="#eab308" color="#eab308" />
                                                        <span>{course.avg_rating?.toFixed(1) || '-'}</span>
                                                    </div>
                                                    <span className="dot">•</span>
                                                    <span>{course.level}</span>
                                                </div>

                                                <div className="course-footer">
                                                    <p className="course-price">{formatPrice(course.price || 0)}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-results">
                                    <div className="no-results-icon">
                                        <Search size={48} />
                                    </div>
                                    <h3>No courses found</h3>
                                    <p>Try adjusting your filters or search query</p>
                                    <button className="btn btn-primary" onClick={clearFilters}>
                                        Clear Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CoursesPage;

