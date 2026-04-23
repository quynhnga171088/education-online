import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="bg-dark text-white py-5 mt-auto">
      <div className="container">
        <div className="row g-4">
          <div className="col-md-4">
            <h5 className="fw-bold mb-3">🎓 LMS Platform</h5>
            <p className="text-white-50 small">
              Nền tảng học trực tuyến chất lượng cao, giúp bạn nâng cao kỹ năng mọi lúc mọi nơi.
            </p>
          </div>
          <div className="col-md-4">
            <h6 className="fw-semibold mb-3">Khám phá</h6>
            <ul className="list-unstyled small">
              <li className="mb-1">
                <Link to="/courses" className="text-white-50 text-decoration-none">
                  Danh sách khóa học
                </Link>
              </li>
              <li className="mb-1">
                <Link to="/my-courses" className="text-white-50 text-decoration-none">
                  Khóa học của tôi
                </Link>
              </li>
              <li className="mb-1">
                <Link to="/my-enrollments" className="text-white-50 text-decoration-none">
                  Đăng ký của tôi
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-md-4">
            <h6 className="fw-semibold mb-3">Tài khoản</h6>
            <ul className="list-unstyled small">
              <li className="mb-1">
                <Link to="/login" className="text-white-50 text-decoration-none">
                  Đăng nhập
                </Link>
              </li>
              <li className="mb-1">
                <Link to="/register" className="text-white-50 text-decoration-none">
                  Đăng ký
                </Link>
              </li>
              <li className="mb-1">
                <Link to="/profile" className="text-white-50 text-decoration-none">
                  Thông tin cá nhân
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <hr className="border-secondary my-4" />
        <p className="text-center text-white-50 small mb-0">
          &copy; 2026 LMS Platform. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
