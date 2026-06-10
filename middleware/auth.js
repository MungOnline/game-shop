module.exports = {
  isAuthenticated: (req, res, next) => {
    if (req.session.userId) {
      return next();
    }
    req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
    res.redirect('/signin');
  },

  isAdmin: (req, res, next) => {
    if (req.session.userId && req.session.role === 'admin') {
      return next();
    }
    req.flash('error', 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
    res.redirect('/');
  },

  isNotAuthenticated: (req, res, next) => {
    if (!req.session.userId) {
      return next();
    }
    res.redirect('/');
  }
};
