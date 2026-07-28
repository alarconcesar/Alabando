import s from './Skeleton.module.css';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

/** Single shimmer block */
export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn(s.skeleton, className)} style={style} />;
}

/** Hymn list item skeleton (for AllHymns, Search, History, Favoritos, Nuevos) */
export function SkeletonHimnoItem() {
  return (
    <>
      <div className={s['skeleton-himno-item']}>
        <Skeleton className={s['skeleton-badge']} />
        <div className={s['skeleton-text-block']}>
          <Skeleton className={s['skeleton-title']} />
          <Skeleton className={s['skeleton-subtitle']} />
        </div>
        <Skeleton className={s['skeleton-icon']} />
      </div>
      <div className="himno-item-divider" />
    </>
  );
}

/** Hymn detail page skeleton */
export function SkeletonDetail() {
  return (
    <div style={{ padding: '40px 24px', maxWidth: 600, margin: '0 auto' }}>
      <Skeleton className={s['skeleton-detail-title']} />
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className={i % 3 === 2 ? s['skeleton-line-short'] : s['skeleton-line']} />
      ))}
    </div>
  );
}

/** Generic page skeleton (cards + header) */
export function SkeletonPage() {
  return (
    <div className={s['skeleton-page']}>
      <Skeleton className={s['skeleton-header-line']} />
      <Skeleton className={s['skeleton-card']} />
      <Skeleton className={s['skeleton-card']} style={{ height: 80 }} />
    </div>
  );
}

/** Home page skeleton */
export function SkeletonHome() {
  return (
    <div style={{ padding: '24px 20px' }}>
      <Skeleton className={s['skeleton-header-line']} />
      <div style={{ display: 'flex', gap: 16, margin: '20px 0' }}>
        <Skeleton className={s['skeleton-card']} style={{ flex: 1, height: 130 }} />
        <Skeleton className={s['skeleton-card']} style={{ flex: 1, height: 130 }} />
      </div>
      <Skeleton className={s['skeleton-card']} style={{ height: 160 }} />
      <div style={{ marginTop: 24 }}>
        <Skeleton className={s['skeleton-header-line']} style={{ width: '50%' }} />
        <div style={{ background: 'var(--surface)', borderRadius: 24, marginTop: 12, overflow: 'hidden' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonHimnoItem key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Albums page skeleton */
export function SkeletonAlbumes() {
  return (
    <div style={{ padding: '20px' }}>
      <Skeleton className={s['skeleton-header-line']} style={{ width: '30%', marginBottom: 20 }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ padding: '16px 0' }}>
          <Skeleton style={{ height: 18, width: '60%', marginBottom: 6 }} />
          <Skeleton style={{ height: 14, width: '30%' }} />
          {i < 5 && <div className="himno-item-divider" style={{ marginTop: 16 }} />}
        </div>
      ))}
    </div>
  );
}
