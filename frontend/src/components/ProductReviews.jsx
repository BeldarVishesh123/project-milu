import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Star, 
  ThumbsUp, 
  CheckCircle2, 
  MessageSquare, 
  Plus, 
  X, 
  ChevronDown, 
  User, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  LogIn,
  Loader2,
  ExternalLink,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';

export default function ProductReviews({ 
  productId, 
  productName, 
  user = null,
  apiBaseUrl = '/api',
  isFullPage = false,
  onRequireLogin = null,
  onReviewChanged = null,
  onOpenFullReviews = null
}) {
  const safeProductId = productId !== undefined && productId !== null ? productId : 1;

  // Stored callback reference to avoid re-render loops
  const onReviewChangedRef = useRef(onReviewChanged);
  useEffect(() => {
    onReviewChangedRef.current = onReviewChanged;
  }, [onReviewChanged]);

  // Review list & pagination state
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filterRating, setFilterRating] = useState('all');
  const [sortOption, setSortOption] = useState('recent');
  const [filteredTotal, setFilteredTotal] = useState(0);

  // Overall product stats
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  // UI state
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [helpfulVoted, setHelpfulVoted] = useState(new Set());

  // Form State for New Review
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    review_text: ''
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Editing State for Own Review
  const [editingReview, setEditingReview] = useState(null);
  const [editFormData, setEditFormData] = useState({
    rating: 5,
    title: '',
    review_text: ''
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Active fetch tracking ID to ignore stale responses
  const activeFetchIdRef = useRef(0);

  // Helper to get fresh/stored customer token
  const getCustomerToken = useCallback(async () => {
    if (user?.token) return user.token;
    const stored = localStorage.getItem('krishiv_auth_token');
    if (stored) return stored;

    const savedUserStr = localStorage.getItem('user');
    const u = user || (savedUserStr ? JSON.parse(savedUserStr) : null);
    if (u && (u.id || u.email)) {
      try {
        const res = await fetch(`${apiBaseUrl}/auth/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: u.id, email: u.email, name: u.name })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            localStorage.setItem('krishiv_auth_token', data.token);
            return data.token;
          }
        }
      } catch (e) {
        console.warn('Could not retrieve customer token:', e.message);
      }
    }
    return null;
  }, [user, apiBaseUrl]);

  // Fetch initial page of reviews
  const fetchInitialReviews = useCallback(async (prodId, rating, sort) => {
    const fetchId = ++activeFetchIdRef.current;
    setLoading(true);
    setFetchError('');
    setPage(1);

    try {
      const token = await getCustomerToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = `${apiBaseUrl}/products/${encodeURIComponent(prodId)}/reviews?page=1&limit=10&rating=${rating}&sort=${sort}`;
      const res = await fetch(url, { headers });

      // Stale request guard
      if (fetchId !== activeFetchIdRef.current) return;

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const fetchedList = Array.isArray(data.reviews) ? data.reviews : [];
          setReviews(fetchedList);
          setHasMore(Boolean(data.has_more));
          setFilteredTotal(data.filtered_total !== undefined ? data.filtered_total : data.total);

          const newStats = {
            total: data.total || 0,
            average: data.average_rating || 0,
            breakdown: data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
          };
          setStats(newStats);

          // Notify parent without re-triggering this effect
          if (onReviewChangedRef.current) {
            onReviewChangedRef.current({
              total: newStats.total,
              average: newStats.average,
              productId: safeProductId
            });
          }
        } else {
          setFetchError(data.error || 'Failed to load reviews.');
          setReviews([]);
          setHasMore(false);
          setFilteredTotal(0);
        }
      } else {
        setFetchError('Unable to load reviews. Please verify your connection.');
        setReviews([]);
        setHasMore(false);
      }
    } catch (err) {
      if (fetchId === activeFetchIdRef.current) {
        console.warn('Review fetch network error:', err.message);
        setFetchError('Network error while connecting to review server.');
        setReviews([]);
        setHasMore(false);
      }
    } finally {
      if (fetchId === activeFetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [apiBaseUrl, getCustomerToken]);

  // Load reviews on mount or whenever product, filter or sort changes
  useEffect(() => {
    fetchInitialReviews(safeProductId, filterRating, sortOption);
  }, [safeProductId, filterRating, sortOption, fetchInitialReviews]);

  // Fetch next page when user clicks "Load More Reviews"
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const token = await getCustomerToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const nextPage = page + 1;
      const url = `${apiBaseUrl}/products/${encodeURIComponent(safeProductId)}/reviews?page=${nextPage}&limit=10&rating=${filterRating}&sort=${sortOption}`;
      const res = await fetch(url, { headers });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.reviews)) {
          setReviews(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newUnique = data.reviews.filter(r => !existingIds.has(r.id));
            return [...prev, ...newUnique];
          });
          setPage(nextPage);
          setHasMore(Boolean(data.has_more));
          if (data.filtered_total !== undefined) setFilteredTotal(data.filtered_total);
        }
      }
    } catch (err) {
      console.error('Error loading more reviews:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Check if current user has already submitted a review
  const userExistingReview = useMemo(() => {
    const currentId = user?.id || (() => {
      try {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved)?.id : null;
      } catch (e) {
        return null;
      }
    })();
    if (!currentId) return null;
    return reviews.find(r => r.is_own_review || String(r.user_id) === String(currentId));
  }, [reviews, user]);

  // Handle clicking "Write a Review" button
  const handleWriteClick = () => {
    const isAuthed = Boolean(user?.token || localStorage.getItem('krishiv_auth_token') || localStorage.getItem('user'));
    if (!isAuthed) {
      setShowGuestPrompt(true);
      setShowWriteForm(false);
      return;
    }
    if (userExistingReview) {
      handleStartEdit(userExistingReview);
      return;
    }
    setShowGuestPrompt(false);
    setShowWriteForm(prev => !prev);
    setFormError('');
    setFormSuccess('');
  };

  // Submit new review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formData.review_text.trim() || formData.review_text.trim().length < 5) {
      setFormError('Please enter a detailed review description (minimum 5 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getCustomerToken();
      if (!token) {
        setFormError('Authentication required. Please sign in to submit a review.');
        setShowGuestPrompt(true);
        setSubmitting(false);
        return;
      }

      const payload = {
        rating: formData.rating,
        title: formData.title.trim(),
        review_text: formData.review_text.trim(),
        description: formData.review_text.trim()
      };

      const res = await fetch(`${apiBaseUrl}/products/${encodeURIComponent(safeProductId)}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFormSuccess('Thank you! Your verified review has been published successfully.');
        setFormData({ rating: 5, title: '', review_text: '' });
        await fetchInitialReviews(safeProductId, filterRating, sortOption);
        setTimeout(() => {
          setShowWriteForm(false);
          setFormSuccess('');
        }, 2200);
      } else {
        setFormError(data.error || 'Failed to submit review. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setFormError('Network connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Review Handlers
  const handleStartEdit = (rev) => {
    setEditingReview(rev);
    setEditFormData({
      rating: rev.rating || 5,
      title: rev.title || '',
      review_text: rev.review_text || rev.comment || ''
    });
    setEditError('');
    setShowWriteForm(false);
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!editingReview) return;
    setEditError('');

    if (!editFormData.review_text.trim() || editFormData.review_text.trim().length < 5) {
      setEditError('Please enter a detailed review description (minimum 5 characters).');
      return;
    }

    setEditSubmitting(true);
    try {
      const token = await getCustomerToken();
      if (!token) {
        setEditError('Authentication session expired. Please sign in again.');
        setEditSubmitting(false);
        return;
      }

      const res = await fetch(`${apiBaseUrl}/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: editFormData.rating,
          title: editFormData.title.trim(),
          review_text: editFormData.review_text.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingReview(null);
        await fetchInitialReviews(safeProductId, filterRating, sortOption);
      } else {
        setEditError(data.error || 'Failed to update review.');
      }
    } catch (err) {
      setEditError('Network error while updating review.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete Review Handler
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    setDeletingId(reviewId);
    try {
      const token = await getCustomerToken();
      if (!token) {
        alert('Authentication required.');
        return;
      }

      const res = await fetch(`${apiBaseUrl}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        if (editingReview?.id === reviewId) setEditingReview(null);
        await fetchInitialReviews(safeProductId, filterRating, sortOption);
      } else {
        const data = await res.json();
        alert(data.error || 'Could not delete review.');
      }
    } catch (err) {
      alert('Network error while deleting review.');
    } finally {
      setDeletingId(null);
    }
  };

  // Upvote helpful review
  const handleHelpfulClick = async (revId) => {
    if (helpfulVoted.has(revId)) return;
    setHelpfulVoted(prev => new Set(prev).add(revId));
    setReviews(prev => prev.map(r => r.id === revId ? { ...r, helpful_count: (Number(r.helpful_count) || 0) + 1 } : r));

    try {
      const token = await getCustomerToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${apiBaseUrl}/reviews/${revId}/helpful`, { method: 'POST', headers });
    } catch (e) {
      console.warn('Could not record helpful vote:', e.message);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'KC';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['#8f8269', '#059669', '#2563eb', '#7c3aed', '#d97706', '#db2777', '#0891b2', '#4b5563'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatReviewDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const ratingLabels = {
    5: '5.0 — Excellent & Pure',
    4: '4.0 — Very Good Quality',
    3: '3.0 — Average Experience',
    2: '2.0 — Below Expectations',
    1: '1.0 — Poor Quality'
  };

  return (
    <div 
      id="product-reviews-section" 
      className="product-reviews-container" 
      style={{ 
        marginTop: isFullPage ? '0' : '28px', 
        paddingTop: isFullPage ? '0' : '24px', 
        borderTop: isFullPage ? 'none' : '1px solid var(--cream-deep, #e2e8f0)' 
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: isFullPage ? '22px' : '18px', fontWeight: '800', color: 'var(--ink, #1e293b)' }}>
              Customer Reviews &amp; Ratings
            </h3>
            {stats.total > 0 && (
              <span style={{ background: 'rgba(143, 130, 105, 0.12)', color: '#8f8269', fontSize: '12px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>
                {stats.total} {stats.total === 1 ? 'Review' : 'Reviews'}
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--ink-soft, #64748b)' }}>
            Real customer feedback for {productName}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!isFullPage && onOpenFullReviews && (
            <button
              onClick={onOpenFullReviews}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'transparent',
                color: '#8f8269',
                border: '1px solid #cbd5e1',
                padding: '7px 12px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Open full dedicated review page"
            >
              <ExternalLink size={13} />
              Full Page View
            </button>
          )}

          {userExistingReview ? (
            <button
              onClick={() => handleStartEdit(userExistingReview)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f8fafc',
                color: '#334155',
                border: '1.5px solid #cbd5e1',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Edit3 size={14} color="#8f8269" />
              Edit Your Review
            </button>
          ) : (
            <button
              onClick={handleWriteClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: showWriteForm ? '#f1f5f9' : '#8f8269',
                color: showWriteForm ? '#334155' : '#ffffff',
                border: showWriteForm ? '1px solid #cbd5e1' : 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: showWriteForm ? 'none' : '0 2px 8px rgba(143, 130, 105, 0.25)'
              }}
            >
              {showWriteForm ? <X size={15} /> : <Plus size={15} />}
              {showWriteForm ? 'Cancel' : 'Write a Review'}
            </button>
          )}
        </div>
      </div>

      {/* Guest Login Prompt Modal / Alert */}
      {showGuestPrompt && (
        <div style={{
          background: '#fffbeb',
          border: '1.5px solid #fde68a',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LogIn size={20} color="#b45309" />
            <div>
              <div style={{ fontWeight: '800', fontSize: '13px', color: '#92400e' }}>
                Sign In Required to Submit a Review
              </div>
              <div style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
                Please log in or create an account with your verified email to share your product experience.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                setShowGuestPrompt(false);
                if (onRequireLogin) onRequireLogin();
              }}
              style={{
                background: '#8f8269',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Sign In / Register
            </button>
            <button
              onClick={() => setShowGuestPrompt(false)}
              style={{
                background: 'transparent',
                border: '1px solid #d97706',
                color: '#92400e',
                padding: '7px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Review Scorecard Box (Shown when reviews exist) */}
      {stats.total > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.75) 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: 'minmax(140px, auto) 1fr',
          gap: '24px',
          alignItems: 'center'
        }}>
          {/* Left Big Score */}
          <div style={{ textAlign: 'center', paddingRight: '20px', borderRight: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '38px', fontWeight: '900', color: '#1e293b', lineHeight: '1' }}>
              {stats.average}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', color: '#f59e0b', margin: '6px 0 4px', fontSize: '16px' }}>
              {'★'.repeat(Math.round(stats.average)) + '☆'.repeat(5 - Math.round(stats.average))}
            </div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
              {stats.average} out of 5
            </div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', marginTop: '3px' }}>
              Based on {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
            </div>
          </div>

          {/* Right Star Breakdown Bars (5 stars down to 1 star) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[5, 4, 3, 2, 1].map(star => {
              const count = stats.breakdown[star] || 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              const isSelected = filterRating === String(star);
              return (
                <div 
                  key={star} 
                  onClick={() => setFilterRating(filterRating === String(star) ? 'all' : String(star))}
                  title={`Filter by ${star} stars`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    fontSize: '11.5px', 
                    cursor: 'pointer',
                    opacity: (filterRating === 'all' || isSelected) ? 1 : 0.45,
                    transition: 'opacity 0.2s'
                  }}
                >
                  <span style={{ width: '42px', fontWeight: '700', color: isSelected ? '#8f8269' : '#334155' }}>
                    {star} {star === 1 ? 'star' : 'stars'}
                  </span>
                  <div style={{ flex: 1, height: '9px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${pct}%`, 
                      height: '100%', 
                      background: star >= 4 ? '#f59e0b' : (star === 3 ? '#fbbf24' : '#94a3b8'), 
                      borderRadius: '5px', 
                      transition: 'width 0.4s ease' 
                    }} />
                  </div>
                  <span style={{ width: '56px', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '11px' }}>
                    {pct}% ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Write Review Form */}
      {showWriteForm && (
        <form onSubmit={handleSubmitReview} style={{
          background: '#ffffff',
          border: '1.5px solid #8f8269',
          borderRadius: '16px',
          padding: '22px',
          marginBottom: '24px',
          boxShadow: '0 8px 24px rgba(143, 130, 105, 0.12)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
              Write a Review for {productName}
            </h4>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Posting as: <strong style={{ color: '#1e293b' }}>{user?.name || user?.email?.split('@')[0] || 'Authenticated Customer'}</strong>
            </span>
          </div>

          {formSuccess ? (
            <div style={{ padding: '16px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', color: '#166534', fontWeight: '700', fontSize: '13px', textAlign: 'center' }}>
              ✓ {formSuccess}
            </div>
          ) : (
            <>
              {formError && (
                <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '12px', fontWeight: '600', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Star Rating Interactive Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  Overall Star Rating <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(s => {
                    const active = hoverRating ? s <= hoverRating : s <= formData.rating;
                    return (
                      <button
                        key={s}
                        type="button"
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setFormData(f => ({ ...f, rating: s }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '26px',
                          color: active ? '#f59e0b' : '#cbd5e1',
                          padding: '2px',
                          transition: 'transform 0.15s ease',
                          transform: active ? 'scale(1.1)' : 'scale(1)'
                        }}
                        aria-label={`${s} star`}
                      >
                        ★
                      </button>
                    );
                  })}
                  <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', marginLeft: '8px' }}>
                    {ratingLabels[hoverRating || formData.rating]}
                  </span>
                </div>
              </div>

              {/* Review Title */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                  Review Title <span style={{ color: '#94a3b8', textTransform: 'none', fontWeight: '500' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={120}
                  placeholder="e.g. Excellent purity, amazing results on sensitive skin!"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Review Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                  Detailed Review <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share details about the texture, aroma, application, and results after using this product..."
                  value={formData.review_text}
                  onChange={e => setFormData({ ...formData, review_text: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box', lineHeight: '1.5' }}
                />
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Minimum 5 characters. Your privacy is protected; only your display name will appear.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowWriteForm(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 22px', borderRadius: '8px', background: '#8f8269', color: '#ffffff', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? 'Submitting Review...' : 'Submit Review'}
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Edit Review Modal/Form */}
      {editingReview && (
        <form onSubmit={handleUpdateReview} style={{
          background: '#ffffff',
          border: '1.5px solid #2563eb',
          borderRadius: '16px',
          padding: '22px',
          marginBottom: '24px',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.12)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
              Edit Your Review for {productName}
            </h4>
            <button
              type="button"
              onClick={() => setEditingReview(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={16} />
            </button>
          </div>

          {editError && (
            <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '12px', fontWeight: '600', marginBottom: '14px' }}>
              {editError}
            </div>
          )}

          {/* Edit Stars */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
              Rating <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setEditFormData(f => ({ ...f, rating: s }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '24px',
                    color: s <= editFormData.rating ? '#f59e0b' : '#cbd5e1',
                    padding: '2px'
                  }}
                >
                  ★
                </button>
              ))}
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginLeft: '6px' }}>
                {ratingLabels[editFormData.rating]}
              </span>
            </div>
          </div>

          {/* Edit Title */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
              Review Title
            </label>
            <input
              type="text"
              value={editFormData.title}
              onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Edit Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
              Review Description <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              required
              rows={4}
              value={editFormData.review_text}
              onChange={e => setEditFormData({ ...editFormData, review_text: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Edit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setEditingReview(null)}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editSubmitting}
              style={{ padding: '8px 20px', borderRadius: '8px', background: '#2563eb', color: '#ffffff', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', opacity: editSubmitting ? 0.6 : 1 }}
            >
              {editSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Sort Toolbar (When reviews exist) */}
      {stats.total > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '12px', 
          marginBottom: '18px',
          paddingBottom: '12px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {/* Star Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <button
              onClick={() => setFilterRating('all')}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: filterRating === 'all' ? '1.5px solid #8f8269' : '1px solid #e2e8f0',
                background: filterRating === 'all' ? '#8f8269' : '#ffffff',
                color: filterRating === 'all' ? '#ffffff' : '#475569',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              All ({stats.total})
            </button>
            {[5, 4, 3, 2, 1].map(s => {
              const count = stats.breakdown[s] || 0;
              if (count === 0 && filterRating !== String(s)) return null;
              return (
                <button
                  key={s}
                  onClick={() => setFilterRating(String(s))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: filterRating === String(s) ? '1.5px solid #8f8269' : '1px solid #e2e8f0',
                    background: filterRating === String(s) ? '#8f8269' : '#ffffff',
                    color: filterRating === String(s) ? '#ffffff' : '#475569',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {s} ★ ({count})
                </button>
              );
            })}
          </div>

          {/* Sort Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowUpDown size={13} color="#64748b" />
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '11.5px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer'
              }}
              aria-label="Sort customer reviews"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
          </div>
        </div>
      )}

      {/* Reviews List / Loading / Error / Empty States */}
      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Loader2 size={24} color="#8f8269" className="animate-spin" />
          <span style={{ fontWeight: '600' }}>Loading customer reviews...</span>
        </div>
      ) : fetchError ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#991b1b', fontSize: '13px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '12px' }}>
          <p style={{ margin: '0 0 10px', fontWeight: '700' }}>{fetchError}</p>
          <button
            onClick={() => fetchInitialReviews(safeProductId, filterRating, sortOption)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '8px',
              background: '#991b1b',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} />
            Try Again
          </button>
        </div>
      ) : stats.total === 0 ? (
        /* Empty State */
        <div style={{
          background: '#f8fafc',
          border: '1.5px dashed #cbd5e1',
          borderRadius: '16px',
          padding: '36px 20px',
          textAlign: 'center',
          marginTop: '12px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(143, 130, 105, 0.1)',
            color: '#8f8269',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <MessageSquare size={22} />
          </div>
          <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
            No reviews yet. Be the first to review this product.
          </h4>
          <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#64748b', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
            Have you used our {productName}? Help other conscious shoppers by sharing your authentic experience.
          </p>
          <button
            onClick={handleWriteClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#8f8269',
              color: '#ffffff',
              border: 'none',
              padding: '9px 20px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(143, 130, 105, 0.25)'
            }}
          >
            <Plus size={15} />
            Write the First Review
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12.5px', background: '#f8fafc', borderRadius: '12px' }}>
          No {filterRating}-star reviews found matching the selected filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {reviews.map((rev) => {
            const isVoted = helpfulVoted.has(rev.id);
            const isOwn = rev.is_own_review || (user?.id && String(user.id) === String(rev.user_id));
            const reviewComment = rev.review_text || rev.comment || '';

            return (
              <div
                key={rev.id}
                style={{
                  background: '#ffffff',
                  border: isOwn ? '1.5px solid #cbd5e1' : '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  position: 'relative'
                }}
              >
                {/* Reviewer Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: getAvatarColor(rev.customer_name),
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getInitials(rev.customer_name)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>
                          Customer: {rev.customer_name}
                        </span>
                        {rev.verified_purchase && (
                          <span style={{
                            background: '#dcfce7',
                            color: '#166534',
                            fontSize: '10.5px',
                            fontWeight: '800',
                            padding: '1.5px 7px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <CheckCircle2 size={11} /> Verified Purchase
                          </span>
                        )}
                        {isOwn && (
                          <span style={{
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            Your Review
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        Date: {formatReviewDate(rev.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* Stars Display */}
                  <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '800', letterSpacing: '1px' }}>
                    {'★'.repeat(Math.round(rev.rating || 5)) + '☆'.repeat(5 - Math.round(rev.rating || 5))}
                  </div>
                </div>

                {/* Review Title */}
                {rev.title && (
                  <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#0f172a', marginBottom: '4px' }}>
                    {rev.title}
                  </div>
                )}

                {/* Review Text */}
                <p style={{ margin: '4px 0 10px', fontSize: '12.5px', lineHeight: '1.6', color: '#475569', whiteSpace: 'pre-line' }}>
                  {reviewComment}
                </p>

                {/* Footer: Helpful button & Author Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9', marginTop: '8px' }}>
                  <div>
                    {isOwn && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleStartEdit(rev)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'transparent',
                            border: '1px solid #cbd5e1',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            color: '#334155',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          disabled={deletingId === rev.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'transparent',
                            border: '1px solid #fecaca',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          <Trash2 size={11} /> {deletingId === rev.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleHelpfulClick(rev.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: isVoted ? '#f0fdf4' : 'transparent',
                      border: isVoted ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                      color: isVoted ? '#166534' : '#64748b',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: isVoted ? 'default' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ThumbsUp size={12} style={{ color: isVoted ? '#166534' : '#64748b' }} />
                    Helpful ({rev.helpful_count || 0})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Working Load More Reviews Button */}
      {hasMore && !loading && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              padding: '10px 24px',
              borderRadius: '24px',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              color: '#334155',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: loadingMore ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
            }}
          >
            {loadingMore ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Loading more reviews...</span>
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                <span>Load More Reviews ({Math.max(0, filteredTotal - reviews.length)} remaining)</span>
              </>
            )}
          </button>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
            Showing {reviews.length} of {filteredTotal} {filterRating === 'all' ? '' : `${filterRating}-star `}reviews
          </div>
        </div>
      )}

      {/* All Loaded Indicator */}
      {!hasMore && reviews.length > 0 && reviews.length === filteredTotal && (
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11.5px', color: '#94a3b8' }}>
          ✓ Showing all {reviews.length} available reviews
        </div>
      )}
    </div>
  );
}
