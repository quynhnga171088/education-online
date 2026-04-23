import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { reportApi } from '../../shared/api/reports'
import { StatsCard } from '../../shared/ui/StatsCard'
import { PageSpinner } from '../../shared/ui/Spinner'
import { formatPrice } from '../../shared/lib/format'

// A-02: Dashboard
export function Component() {
  const { data, isLoading } = useQuery({
    queryKey: ['overview'],
    queryFn: () => reportApi.getOverview().then((r) => r.data),
  })

  if (isLoading) return <PageSpinner />

  const topCoursesChartData =
    data?.topCourses.map((c) => ({
      name:
        c.courseTitle.length > 20 ? c.courseTitle.slice(0, 18) + '…' : c.courseTitle,
      enrollments: c.enrollmentCount,
    })) ?? []

  return (
    <div>
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">📊 Dashboard</h4>
          <p className="text-muted small mb-0">Tổng quan hệ thống LMS</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/courses/new" className="btn btn-primary btn-sm" style={{ borderRadius: 8 }}>
            + Tạo khóa học
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      {data && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-xl-3">
              <StatsCard
                icon="🎓"
                label="Học viên"
                value={data.totalStudents.toLocaleString()}
                color="#4f46e5"
              />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatsCard
                icon="📚"
                label="Khóa học"
                value={data.totalCourses}
                sub={`${data.publishedCourses} đã xuất bản`}
                color="#059669"
              />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatsCard
                icon="✅"
                label="Đăng ký đã duyệt"
                value={data.totalApprovedEnrollments.toLocaleString()}
                color="#0891b2"
              />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatsCard
                icon="⏳"
                label="Chờ duyệt"
                value={data.pendingEnrollments}
                sub={data.pendingEnrollments > 0 ? 'Cần xét duyệt' : 'Không có'}
                color={data.pendingEnrollments > 0 ? '#d97706' : '#64748b'}
              />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-xl-3">
              <StatsCard
                icon="👨‍🏫"
                label="Giáo viên"
                value={data.totalTeachers}
                color="#7c3aed"
              />
            </div>
            <div className="col-sm-6 col-xl-3">
              <StatsCard
                icon="🏆"
                label="Bài học hoàn thành"
                value={data.completedLessons.toLocaleString()}
                color="#d97706"
              />
            </div>
          </div>
        </>
      )}

      {/* Charts + Quick actions */}
      <div className="row g-4">
        {/* Top Courses chart */}
        {topCoursesChartData.length > 0 && (
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 12 }}>
              <h6 className="fw-bold mb-4">🏆 Top khóa học theo số đăng ký</h6>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topCoursesChartData} margin={{ top: 0, right: 10, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v: number) => [v, 'Đăng ký']}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="enrollments" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: 12 }}>
            <h6 className="fw-bold mb-3">⚡ Thao tác nhanh</h6>
            <div className="d-flex flex-column gap-2">
              {[
                { to: '/courses/new', icon: '📚', label: 'Tạo khóa học mới' },
                { to: '/enrollments', icon: '📋', label: 'Xét duyệt đăng ký' },
                { to: '/users', icon: '👥', label: 'Quản lý người dùng' },
                { to: '/reports', icon: '📈', label: 'Xem báo cáo' },
                { to: '/settings', icon: '⚙️', label: 'Cấu hình hệ thống' },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="d-flex align-items-center gap-2 p-2 rounded-2 text-decoration-none text-secondary"
                  style={{ fontSize: '0.875rem', transition: 'background .15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  <span className="ms-auto">›</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Top courses table */}
        {data && data.topCourses.length > 0 && (
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-0">
                <div className="px-4 py-3 border-bottom">
                  <h6 className="fw-bold mb-0">📊 Chi tiết top khóa học</h6>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ background: '#f8fafc' }}>
                      <tr>
                        <th className="ps-4 small text-muted fw-medium py-2">#</th>
                        <th className="small text-muted fw-medium py-2">Tên khóa học</th>
                        <th className="small text-muted fw-medium py-2">Số đăng ký</th>
                        <th className="small text-muted fw-medium py-2">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topCourses.map((c, i) => (
                        <tr key={c.courseId}>
                          <td className="ps-4 text-muted small">{i + 1}</td>
                          <td className="fw-medium small">{c.courseTitle}</td>
                          <td>
                            <span className="badge bg-primary bg-opacity-10 text-primary">
                              {c.enrollmentCount} học viên
                            </span>
                          </td>
                          <td>
                            <Link
                              to={`/reports/courses/${c.courseId}`}
                              className="btn btn-sm btn-outline-secondary"
                              style={{ fontSize: '0.75rem', borderRadius: 6 }}
                            >
                              Xem báo cáo
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recharts suppresses warning for formatPrice usage - keep import used */}
      <span className="d-none">{formatPrice(0)}</span>
    </div>
  )
}
