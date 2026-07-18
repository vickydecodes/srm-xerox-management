import { Request, Response, NextFunction } from 'express';
import sendResponse from '@core/constants/responsewrapper.constant.ts';

export function unallocatedRouteMiddleware(req: Request, res: Response, next: NextFunction) {
  const message = 'This route or method is not allowed';
  const accept = req.headers.accept || '';

  if (accept.includes('text/html')) {
    return res.status(404).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>404 · Endpoint Not Found</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --bg: #020617;
      --border: #1e293b;
      --text: #e5e7eb;
      --muted: #94a3b8;

     
      --green: #8DC640;
      --yellow: #FDC215;
    }

    * {
      box-sizing: border-box;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    }

    body {
      margin: 0;
      background:
        radial-gradient(
          1000px 500px at top,
          rgba(141, 198, 64, 0.08),
          transparent
        ),
        var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      padding: 24px;
    }

    .card {
      max-width: 480px;
      width: 100%;
      border-radius: 14px;
      border: 1px solid var(--border);
      padding: 32px;
      background:
        linear-gradient(
          180deg,
          rgba(253, 194, 21, 0.06),
          transparent 60%
        );
      box-shadow:
        0 20px 40px rgba(0,0,0,.45),
        inset 0 1px 0 rgba(255,255,255,.04);
    }

    .badge {
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(141, 198, 64, 0.15);
      color: var(--green);
      margin-bottom: 14px;
    }

    h1 {
      margin: 0 0 10px;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--yellow);
    }

    p {
      margin: 6px 0;
      color: var(--muted);
      line-height: 1.55;
      font-size: 15px;
    }

    code {
      display: block;
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      background: rgba(148,163,184,.08);
      color: var(--text);
      font-size: 13px;
      border: 1px dashed var(--border);
      word-break: break-all;
    }

    .footer {
      margin-top: 18px;
      font-size: 12px;
      color: var(--muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 0 4px rgba(141,198,64,.15);
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">404 · Endpoint Not Found</span>

    <h1>Unknown API route</h1>
    <p>
      The API endpoint you’re trying to access does not exist or is not mapped
      in this service.
    </p>
    <p>
      Please verify the URL and HTTP method.
    </p>

    <code>${req.method} ${req.originalUrl}</code>

    <div class="footer">
      <span>SAP CRM API</span>
      <span class="dot"></span>
    </div>
  </div>
</body>
</html>
  `);
  }

  return sendResponse.forbidden(res, message);
}
