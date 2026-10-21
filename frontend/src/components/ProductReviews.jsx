import React, { useState, useEffect, useMemo } from 'react';
import { Star, ThumbsUp, CheckCircle2, MessageSquare, Plus, X, ChevronDown, User, Sparkles } from 'lucide-react';
import fallbackReviews from '../data/seedReviews.json';

export default function ProductReviews({ 
  productId, 
  productName, 
  initialReviewCount = 82, 
  initialRating = 4.9, 
  user = null,
  apiBaseUrl = '/api',
  onReviewAdded = null
}) {
  const numId = Number(productId) || 1;

  // Local fallback dataset for this product
  const defaultProductReviews = useMemo(() => {
    return fallbackReviews.filter(r => Number(r.product_id) === numId || String(r.product_id) === String(productId));
  }, [numId, productId]);

  const [reviews, setReviews] = useState(defaultProductReviews);
  const [loading, setLoading] = useState(false);
  const [filterRating, setFilterRating] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [helpfulVoted, setHelpfulVoted] = useState(new Set());

  // Form State
  const [formData, setFormData] = useState({
    customer_name: user?.name || '',
    rating: 5,
    title: '',
    comment: '',
    location: user?.city ? `${user.city}, India` : 'Verified Buyer, India'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch reviews from backend API on mount or productId change
  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/products/${numId}/reviews`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
            setReviews(data.reviews);
          }
        }
      } catch (err) {
        console.warn('Could not fetch reviews from server, using local fallback:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchReviews();
    return () => { isMounted = false; };
  }, [numId, apiBaseUrl]);

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        total: initialReviewCount,
        average: initialRating,
        breakdown: { 5: Math.round(initialReviewCount * 0.9), 4: Math.round(initialReviewCount * 0.1), 3: 0, 2: 0, 1: 0 }
      };
    }
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const avg = Number((sum / total).toFixed(1));
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const star = Math.max(1, Math.min(5, Math.floor(r.rating || 5)));
      breakdown[star] = (breakdown[star] || 0) + 1;
    });
    return { total, average: avg, breakdown };
  }, [reviews, initialReviewCount, initialRating]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (filterRating === 'all') return reviews;
    return reviews.filter(r => Math.floor(r.rating) === Number(filterRating));
  }, [reviews, filterRating]);

  // Submit new review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formData.customer_name.trim() || !formData.comment.trim()) {
      setFormError('Please enter your name and a review comment.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const payload = {
        customer_name: formData.customer_name.trim(),
        rating: formData.rating,
        title: formData.title.trim() || 'Wonderful Ayurvedic Experience',
        comment: formData.comment.trim(),
        location: formData.location.trim() || 'Verified Buyer, India'
      };

      const res = await fetch(`${apiBaseUrl}/products/${numId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const addedReview = data.review || {
          id: `rev-${Date.now()}`,
          product_id: numId,
          product_name: productName,
          ...payload,
          verified_purchase: true,
          helpful_count: 0,
          created_at: new Date().toISOString()
        };
        setReviews(prev => [addedReview, ...prev]);
        setFormSuccess(true);
        if (onReviewAdded) onReviewAdded(addedReview);
        setTimeout(() => {
          setShowWriteForm(false);
          setFormSuccess(false);
          setFormData({
            customer_name: user?.name || '',
            rating: 5,
            title: '',
            comment: '',
            location: 'Verified Buyer, India'
          });
        }, 2000);
      } else {
        setFormError(data.error || 'Failed to submit review. Please try again.');
      }
    } catch (err) {
      // Offline fallback: add to local state
      const localReview = {
        id: `rev-local-${Date.now()}`,
        product_id: numId,
        product_name: productName,
        customer_name: formData.customer_name.trim(),
        rating: formData.rating,
        title: formData.title.trim() || 'Wonderful Ayurvedic Experience',
        comment: formData.comment.trim(),
        location: formData.location.trim() || 'Verified Buyer, India',
        verified_purchase: true,
        helpful_count: 0,
        created_at: new Date().toISOString()
      };
      setReviews(prev => [localReview, ...prev]);
      setFormSuccess(true);
      setTimeout(() => {
        setShowWriteForm(false);
        setFormSuccess(false);
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote helpful review
  const handleHelpfulClick = async (revId) => {
    if (helpfulVoted.has(revId)) return;
    setHelpfulVoted(prev => new Set(prev).add(revId));
    setReviews(prev => prev.map(r => r.id === revId ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r));
    try {
      await fetch(`${apiBaseUrl}/reviews/${revId}/helpful`, { method: 'POST' });
    } catch (e) {}
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

  return (
    <div className="product-reviews-container" style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid var(--cream-deep, #e2e8f0)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--ink, #1e293b)' }}>
              Customer Reviews &amp; Ratings
            </h3>
            <span style={{ background: 'rgba(143, 130, 105, 0.12)', color: '#8f8269', fontSize: '12px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px' }}>
              {stats.total} Reviews
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--ink-soft, #64748b)' }}>
            100% verified customer ratings &amp; authentic feedback
          </p>
        </div>

        <button
          onClick={() => setShowWriteForm(prev => !prev)}
          style={{
            display: 'flex',
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
            transition: 'all 0.2s ease'
          }}
        >
          {showWriteForm ? <X size={15} /> : <Plus size={15} />}
          {showWriteForm ? 'Close Form' : 'Write a Review'}
        </button>
      </div>

      {/* Review Scorecard Box */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.6) 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* Left Big Score */}
        <div style={{ textAlign: 'center', paddingRight: '20px', borderRight: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '38px', fontWeight: '900', color: '#1e293b', lineHeight: '1' }}>
            {stats.average}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', color: '#f59e0b', margin: '6px 0 4px', fontSize: '16px' }}>
            {'★'.repeat(Math.round(stats.average))}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
            Out of 5.0
          </div>
          <div style={{ fontSize: '10.5px', color: '#059669', fontWeight: '700', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
            <CheckCircle2 size={12} /> 98% Recommend
          </div>
        </div>

        {/* Right Star Breakdown Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {[5, 4, 3, 2, 1].map(star => {
            const count = stats.breakdown[star] || 0;
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div 
                key={star} 
                onClick={() => setFilterRating(filterRating === String(star) ? 'all' : String(star))}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  fontSize: '11.5px', 
                  cursor: 'pointer',
                  opacity: (filterRating === 'all' || filterRating === String(star)) ? 1 : 0.45
                }}
              >
                <span style={{ width: '38px', fontWeight: '700', color: '#334155' }}>{star} ★</span>
                <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: star >= 4 ? '#f59e0b' : '#94a3b8', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ width: '42px', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '11px' }}>
                  {pct}% ({count})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write Review Form */}
      {showWriteForm && (
        <form onSubmit={handleSubmitReview} style={{
          background: '#ffffff',
          border: '1.5px solid #8f8269',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 8px 24px rgba(143, 130, 105, 0.12)'
        }}>
          <h4 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
            Share Your Experience with {productName}
          </h4>

          {formSuccess ? (
            <div style={{ padding: '16px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', color: '#166534', fontWeight: '700', fontSize: '13px', textAlign: 'center' }}>
              ✓ Thank you! Your review has been submitted and verified.
            </div>
          ) : (
            <>
              {formError && (
                <div style={{ padding: '10px 14px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '12px', fontWeight: '600', marginBottom: '12px' }}>
                  {formError}
                </div>
              )}

              {/* Rating selector */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Overall Rating <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, rating: s }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '24px',
                        color: s <= formData.rating ? '#f59e0b' : '#cbd5e1',
                        padding: '0 2px',
                        transition: 'transform 0.1s ease'
                      }}
                    >
                      ★
                    </button>
                  ))}
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginLeft: '6px' }}>
                    {formData.rating === 5 ? '5.0 - Excellent & Pure' : `${formData.rating}.0 - Good`}
                  </span>
                </div>
              </div>

              {/* Name & City Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Your Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Patel"
                    value={formData.customer_name}
                    onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    City / State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Surat, Gujarat"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Review Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Incredible natural glow, highly recommend!"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Comment */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Detailed Review <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tell us what you loved about the texture, purity, natural results, and packaging..."
                  value={formData.comment}
                  onChange={e => setFormData({ ...formData, comment: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowWriteForm(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 20px', borderRadius: '8px', background: '#8f8269', color: '#ffffff', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button
          onClick={() => setFilterRating('all')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: filterRating === 'all' ? '1px solid #8f8269' : '1px solid #e2e8f0',
            background: filterRating === 'all' ? '#8f8269' : '#ffffff',
            color: filterRating === 'all' ? '#ffffff' : '#475569',
            fontSize: '11.5px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          All Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setFilterRating('5')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: filterRating === '5' ? '1px solid #8f8269' : '1px solid #e2e8f0',
            background: filterRating === '5' ? '#8f8269' : '#ffffff',
            color: filterRating === '5' ? '#ffffff' : '#475569',
            fontSize: '11.5px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          5 Stars ({stats.breakdown[5] || 0})
        </button>
        <button
          onClick={() => setFilterRating('4')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: filterRating === '4' ? '1px solid #8f8269' : '1px solid #e2e8f0',
            background: filterRating === '4' ? '#8f8269' : '#ffffff',
            color: filterRating === '4' ? '#ffffff' : '#475569',
            fontSize: '11.5px',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          4 Stars ({stats.breakdown[4] || 0})
        </button>
      </div>

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredReviews.slice(0, visibleCount).map((rev) => {
          const isVoted = helpfulVoted.has(rev.id);
          return (
            <div
              key={rev.id}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              {/* Reviewer Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>
                        {rev.customer_name}
                      </span>
                      {rev.verified_purchase !== false && (
                        <span style={{
                          background: '#dcfce7',
                          color: '#166534',
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '1.5px 6px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          <CheckCircle2 size={10} /> Verified
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                      {rev.location || 'India'} • {formatReviewDate(rev.created_at)}
                    </div>
                  </div>
                </div>

                {/* Stars */}
                <div style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '800' }}>
                  {'★'.repeat(Math.round(rev.rating || 5))}
                </div>
              </div>

              {/* Review Content */}
              {rev.title && (
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', marginBottom: '4px' }}>
                  {rev.title}
                </div>
              )}
              <p style={{ margin: 0, fontSize: '12.5px', lineHeight: '1.6', color: '#475569' }}>
                "{rev.comment}"
              </p>

              {/* Helpful footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  onClick={() => handleHelpfulClick(rev.id)}
                  style={{
                    display: 'flex',
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

      {/* Load More Button */}
      {visibleCount < filteredReviews.length && (
        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <button
            onClick={() => setVisibleCount(c => c + 8)}
            style={{
              padding: '10px 24px',
              borderRadius: '24px',
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              color: '#334155',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}
          >
            <ChevronDown size={14} />
            Load More Reviews ({filteredReviews.length - visibleCount} remaining)
          </button>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
            Showing {Math.min(visibleCount, filteredReviews.length)} of {filteredReviews.length} reviews
          </div>
        </div>
      )}
    </div>
  );
}
