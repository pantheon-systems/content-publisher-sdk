import http from "http";
import open from "open";
import destroyer from "server-destroy";

const BRIDGE_PORT = 3030;

interface BridgeOptions {
  popupUrl: string;
  pagePath: string;
  title: string;
  message: string;
}

interface BridgeResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

export function buildBridgeHtml(options: BridgeOptions): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>${options.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f5f5f5; }
    .container { text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 400px; }
    .spinner { border: 3px solid #e0e0e0; border-top: 3px solid #333; border-radius: 50%; width: 32px; height: 32px; animation: spin 1s linear infinite; margin: 1rem auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success { color: #2e7d32; }
    .error { color: #c62828; }
    h2 { margin: 0 0 0.5rem; }
    p { color: #666; margin: 0.5rem 0; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <div id="waiting">
      <div class="spinner"></div>
      <h2>${options.message}</h2>
      <p>Complete the process in the popup window.</p>
      <p id="popup-blocked" class="hidden" style="color: #c62828; margin-top: 1rem;">
        Popup was blocked. <a href="${options.popupUrl}" target="_blank" rel="opener">Click here</a> to open it manually.
      </p>
    </div>
    <div id="result" class="hidden"></div>
  </div>
  <script>
    (function() {
      var popup = window.open(${JSON.stringify(options.popupUrl)}, '_blank', 'width=1050,height=750,left=' + (screen.width/2 - 525) + ',top=' + (screen.height/2 - 375) + ',scrollbars=yes,resizable=yes');

      if (!popup || popup.closed) {
        document.getElementById('popup-blocked').classList.remove('hidden');
      }

      window.addEventListener('message', function(event) {
        if (typeof event.data !== 'object' || event.data === null) return;
        if (typeof event.data.success !== 'boolean') return;

        var resultDiv = document.getElementById('result');
        var waitingDiv = document.getElementById('waiting');

        if (event.data.success) {
          resultDiv.innerHTML = '<h2 class="success">Success!</h2><p>You can close this window.</p>';
        } else {
          var errMsg = event.data.error || 'An error occurred';
          var errTitle = event.data.errorTitle || 'Error';
          resultDiv.innerHTML = '<h2 class="error">' + errTitle + '</h2><p>' + errMsg + '</p>';
        }

        waitingDiv.classList.add('hidden');
        resultDiv.classList.remove('hidden');

        var params = new URLSearchParams();
        params.set('success', event.data.success);
        if (event.data.error) params.set('error', event.data.error);
        if (event.data.type) params.set('type', event.data.type);
        if (event.data.docId) params.set('docId', event.data.docId);

        fetch('${options.pagePath}/result?' + params.toString())
          .then(function() {
            setTimeout(function() { window.close(); }, 2000);
          });
      });

      if (popup) {
        var pollTimer = setInterval(function() {
          if (popup.closed) {
            clearInterval(pollTimer);
            fetch('${options.pagePath}/result?success=false&error=window_closed');
          }
        }, 2000);
      }
    })();
  </script>
</body>
</html>`;
}

export function openOAuthBridge(options: BridgeOptions): Promise<BridgeResult> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) return;

      if (req.url === options.pagePath || req.url === options.pagePath + "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(buildBridgeHtml(options));
        return;
      }

      if (req.url.startsWith(options.pagePath + "/result")) {
        const params = new URL(req.url, `http://localhost:${BRIDGE_PORT}`)
          .searchParams;
        const success = params.get("success") === "true";
        const error = params.get("error") || undefined;
        const type = params.get("type") || undefined;
        const docId = params.get("docId") || undefined;

        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");

        server.destroy();
        resolve({ success, error, type, docId });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    destroyer(server);

    server.on("error", (err) => {
      reject(err);
    });

    server.listen(BRIDGE_PORT, () => {
      open(`http://localhost:${BRIDGE_PORT}${options.pagePath}`).catch(() => {
        // If browser fails to open, user will need to open manually
      });
    });
  });
}
