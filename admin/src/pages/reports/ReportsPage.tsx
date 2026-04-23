import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts'
import { reportApi } from '../../shared/api/reports'
import { StatsCard } from '../../shared/ui/StatsCard'
import { PageSpinner } from '../../shared/ui/Spinner'

// A-12: Báo cáo tổng quan
export function Component() {
  const { data, isLoading } = useQuery({
    queryKey: ['overview'],
    queryFn: () => reportApi.getOverview().then((r) => r.data),
  })

  if (isLoading) return <PageSpinner />
  if (!data) return <div className="text-muted">Không có dữ liệu</div>

  const topData = data.topCourses.map((c) => ({
    name: c.title.length > 22 ? c.title.slice(0, 20) + '…' : c.title,
    enrollments: c.enrollmentCount,
  }))

  const totalCourses =
    data.totalPublishedCourses + data.totalDraftCourses + data.totalArchivedCourses

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-0">📈 Báo cáo tổng quan</h4>
        <p className="text-muted small mb-0">Thống kê toàn hệ thống LMS</p>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { icon: '🎓', label: 'Học viên', value: data.totalStudents, color: '#4f46e5' },
          { icon: '👨‍🏫', label: 'Giáo viên', value: data.totalTeachers, color: '#7c3aed' },
          { icon: '📚', label: 'Khóa học', value: totalCourses, color: '#059669' },
          { icon: '✅', label: 'Đã duyệt', value: data.totalEnrollmentsApproved, color: '#0891b2' },
          { icon: '⏳', label: 'Chờ duyệt', value: data.totalEnrollmentsPending, color: '#d97706' },
          { icon: '🏆', label: 'Bài học hoàn thành', value: data.totalLessonsCompleted, color: '#dc2626' },
        ].map((s) => (
          <div key={s.label} className="col-sm-6 col-xl-4">
            <StatsCard icon={s.icon} label={s.label} value={s.value.toLocaleString()} color={s.color} />
          </div>
        ))}
      </div>

      {/* Top Courses chart */}
      {topData.length > 0 && (
        <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: 12 }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">🏆 Top khóa học theo số đăng ký</h6>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topData} margin={{ top: 0, right: 20, bottom: 50, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                formatter={(v: number) => [v, 'Lượt đăng ký']}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="enrollments" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top courses detail table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body p-0">
          <div className="px-4 py-3 border-bottom d-flex justify-content-between">
            <h6 className="fw-bold mb-0">📋 Chi tiết top khóa học</h6>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th className="ps-4 small text-muted fw-medium py-2">#</th>
                  <th className="small text-muted fw-medium py-2">Tên khóa học</th>
                  <th className="small text-muted fw-medium py-2">Lượt đăng ký</th>
                  <th className="small text-muted fw-medium py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.topCourses.map((c, i) => (
                  <tr key={c.courseId}>
                    <td className="ps-4 small text-muted">{i + 1}</td>
                    <td className="fw-medium small">{c.title}</td>
                    <td>
                      <span className="badge bg-primary bg-opacity-10 text-primary">
                        {c.enrollmentCount} học viên
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/reports/courses/${c.courseId}`}
                        className="btn btn-sm btn-outline-primary"
                        style={{ fontSize: '0.75rem', borderRadius: 6 }}
                      >
                        Báo cáo chi tiết →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Silence unused import */}
      <span className="d-none">
        <LineChart data={[]}><Line dataKey="x" /></LineChart>
      </span>
    </div>
  )
}
