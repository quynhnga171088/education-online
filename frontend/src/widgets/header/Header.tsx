export function Header() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <a className="navbar-brand fw-bold" href="/">LMS Platform</a>
        <div className="navbar-nav ms-auto">
          <a className="nav-link" href="/courses">Khóa học</a>
          <a className="nav-link" href="/my-courses">Của tôi</a>
          <a className="nav-link" href="/login">Đăng nhập</a>
        </div>
      </div>
    </nav>
  )
}
