import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { courseApi } from 'src/shared/api/courses'
import { CourseCard } from 'src/widgets/course-card/CourseCard'
import { PageSpinner } from 'src/shared/ui/Spinner'
import { Pagination } from 'src/shared/ui/Pagination'
import { EmptyState } from 'src/shared/ui/EmptyState'
import { useDebounce } from 'src/shared/hooks/useDebounce'

// S-04: Danh sách khóa học
export function Component() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 350)

  const { data, isLoading } = useQuery({
    queryKey: ['courses', { page, search: debouncedSearch }],
    queryFn: () =>
      courseApi
        .list({ status: 'PUBLISHED', page, size: 12, search: debouncedSearch || undefined })
        .then((r) => r.data),
  })

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(0)
  }, [])

  return (
    <div className="py-5" style={{ background: 'var(--color-bg)', minHeight: '80vh' }}>
      <div className="container">
        {/* ─── Header ─── */}
        <div className="mb-4">
          <h2 className="fw-bold mb-1">Tất cả khóa học</h2>
          <p className="text-muted">
            {data?.totalElements ?? '...'} khóa học đang có sẵn
          </p>
        </div>

        {/* ─── Search ─── */}
        <div className="row mb-4">
          <div className="col-md-6 col-lg-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">🔍</span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Tìm kiếm khóa học..."
                value={search}
                onChange={handleSearch}
              />
              {search && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => { setSearch(''); setPage(0) }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Grid ─── */}
        {isLoading ? (
          <PageSpinner />
        ) : !data?.content.length ? (
          <EmptyState
            icon="🔍"
            title="Không tìm thấy khóa học"
            description="Thử từ khóa khác hoặc xóa bộ lọc"
            action={
              search ? (
                <button className="btn btn-outline-primary btn-sm" onClick={() => setSearch('')}>
                  Xóa tìm kiếm
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="row g-4">
              {data.content.map((course) => (
                <div key={course.id} className="col-sm-6 col-lg-4 col-xl-3">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="mt-5">
                <Pagination
                  page={data.number}
                  totalPages={data.totalPages}
                  onChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
