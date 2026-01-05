export default function GlobalNotFound() {
  return (
    <html lang="fa">
      <body style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        margin: 0,
        fontFamily: 'sans-serif',
        background: '#0a0a0a',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 1rem' }}>404</h1>
          <p>صفحه مورد نظر یافت نشد</p>
          <a href="/fa" style={{ color: '#3b82f6', textDecoration: 'none' }}>بازگشت به صفحه اصلی</a>
        </div>
      </body>
    </html>
  );
}
