import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { reportApi } from '../../shared/api/reports'
import { PageSpinner } from '../../shared/ui/Spinner'
import { monthLabel } from '../../shared/lib/format'

// A-13: Báo cáo chi tiết khóa học
export function Component() {
  const { id } = useParams<{ id: string }>()
  const courseId = Number(id)
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['course-report', courseId],
    queryFn: () => reportApi.getCourseReport(courseId).then((r) => r.data),
    enabled: !!courseId,
  })

  if (isLoading) return <PageSpinner />
  if (!data) return <div className="text-muted py-5 text-center">Không có dữ liệu.</div>

  const trendData = data.monthlyTrend.map((m) => ({
    name: monthLabel(m.year, m.month),
    enrollments: m.count,
  }))

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate('/reports')}
          style={{ borderRadius: 8 }}
        >
          ← Quay lại
        </button>
        <div>
          <h4 className="fw-bold mb-0">📊 Báo cáo khóa học</h4>
          <p className="text-muted small mb-0">{data.courseTitle}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-4">
          <div className="card border-0 shadow-sm p-4 text-center" style={{ borderRadius: 12 }}>
            <div style={{ fontSize: '2rem' }}>📋</div>
            <div className="fw-bold fs-4 mt-2">{data.totalEnrolled}</div>
            <div className="text-muted small">Tổng đăng ký</div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card border-0 shadow-sm p-4 text-center" style={{ borderRadius: 12 }}>
            <div style={{ fontSize: '2rem' }}>✅</div>
            <div className="fw-bold fs-4 mt-2">{data.approvedEnrollments}</div>
            <div className="text-muted small">Đã duyệt</div>
          </div>
        </div>
        <div className="col-sm-4">
          <div className="card border-0 shadow-sm p-4 text-center" style={{ borderRadius: 12 }}>
            <div style={{ fontSize: '2rem' }}>📚</div>
            <div className="fw-bold fs-4 mt-2">{data.lessonStats.length}</div>
            <div className="text-muted small">Bài học</div>
          </div>
        </div>
      </div>

      {/* Monthly trend chart */}
      {trendData.length > 0 && (
        <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: 12 }}>
          <h6 className="fw-bold mb-4">📅 Xu hướng đăng ký theo tháng</h6>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trendData} margin={{ top: 0, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                formatter={(v: number) => [v, 'Đăng ký']}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="enrollments" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Lesson stats */}
      {data.lessonStats.length > 0 && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="px-4 py-3 border-bottom">
            <h6 className="fw-bold mb-0">📋 Thống kê hoàn thành bài học</h6>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th className="ps-4 small text-muted fw-medium py-2">#</th>
                  <th className="small text-muted fw-medium py-2">Bài học</th>
                  <th className="small text-muted fw-medium py-2">Hoàn thành</th>
                  <th className="small text-muted fw-medium py-2">Tỉ lệ</th>
                </tr>
              </thead>
              <tbody>
                {data.lessonStats.map((ls, i) => {
                  const pct =
                    ls.totalEnrolled > 0
                      ? Math.round((ls.completedCount / ls.totalEnrolled) * 100)
                      : 0
                  return (
                    <tr key={ls.lessonId}>
                      <td className="ps-4 small text-muted">{i + 1}</td>
                      <td className="fw-medium small">{ls.lessonTitle}</td>
                      <td className="small">
                        {ls.completedCount}/{ls.totalEnrolled}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="progress flex-grow-1"
                            style={{ height: 6, maxWidth: 100 }}
                          >
                            <div
                              className="progress-bar bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="small fw-semibold text-primary">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
