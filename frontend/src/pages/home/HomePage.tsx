import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { courseApi } from 'src/shared/api/courses'
import { CourseCard } from 'src/widgets/course-card/CourseCard'
import { PageSpinner } from 'src/shared/ui/Spinner'

// S-01: Trang chủ
export function Component() {
  const { data, isLoading } = useQuery({
    queryKey: ['courses', 'featured'],
    queryFn: () =>
      courseApi.list({ status: 'PUBLISHED', size: 6, page: 0 }).then((r) => r.data),
  })

  return (
    <>
      {/* ─── Hero ─── */}
      <section
        style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          color: '#fff',
          padding: '5rem 0',
        }}
      >
        <div className="container text-center">
          <span
            className="badge bg-white text-primary fw-semibold mb-3"
            style={{ fontSize: '0.8rem', borderRadius: 20, padding: '6px 14px' }}
          >
            🚀 Học trực tuyến chất lượng cao
          </span>
          <h1 className="display-5 fw-bold mb-3" style={{ lineHeight: 1.2 }}>
            Nâng cao kỹ năng của bạn
            <br />
            <span style={{ color: '#fde68a' }}>cùng LMS Platform</span>
          </h1>
          <p className="lead mb-4 opacity-75" style={{ maxWidth: 600, margin: '0 auto 2rem' }}>
            Hàng trăm khóa học chất lượng từ các chuyên gia hàng đầu.
            Học mọi lúc, mọi nơi với lộ trình phù hợp.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link to="/courses" className="btn btn-light btn-lg fw-semibold" style={{ borderRadius: 12 }}>
              🔍 Khám phá khóa học
            </Link>
            <Link to="/register" className="btn btn-outline-light btn-lg" style={{ borderRadius: 12 }}>
              Đăng ký miễn phí
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-4 bg-white border-bottom">
        <div className="container">
          <div className="row text-center g-3">
            {[
              { icon: '📚', label: 'Khóa học', value: '100+' },
              { icon: '👩‍🎓', label: 'Học viên', value: '5,000+' },
              { icon: '🏆', label: 'Chứng chỉ', value: '2,000+' },
              { icon: '⭐', label: 'Đánh giá trung bình', value: '4.8/5' },
            ].map((s) => (
              <div key={s.label} className="col-6 col-md-3">
                <div className="p-3">
                  <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
                  <div className="fw-bold fs-5 mt-1">{s.value}</div>
                  <div className="text-muted small">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Courses ─── */}
      <section className="py-5" style={{ background: 'var(--color-bg)' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">Khóa học nổi bật</h2>
              <p className="text-muted mb-0">Được nhiều học viên đăng ký nhất</p>
            </div>
            <Link to="/courses" className="btn btn-outline-primary btn-sm" style={{ borderRadius: 8 }}>
              Xem tất cả →
            </Link>
          </div>

          {isLoading ? (
            <PageSpinner />
          ) : (
            <div className="row g-4">
              {data?.content.map((course) => (
                <div key={course.id} className="col-sm-6 col-lg-4">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section
        className="py-5 text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}
      >
        <div className="container">
          <h2 className="fw-bold mb-3">Sẵn sàng bắt đầu học chưa?</h2>
          <p className="opacity-75 mb-4">
            Đăng ký tài khoản miễn phí và truy cập hàng trăm khóa học ngay hôm nay
          </p>
          <Link to="/register" className="btn btn-primary btn-lg fw-semibold" style={{ borderRadius: 12, padding: '0.75rem 2.5rem' }}>
            Bắt đầu ngay
          </Link>
        </div>
      </section>
    </>
  )
}
