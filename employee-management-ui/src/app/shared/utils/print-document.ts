/** Opens the generated letter HTML in a window or hidden iframe and triggers A4 print / Save as PDF. */
export function openDocumentPrintPreview(html: string, existingWindow?: Window | null): boolean {
  if (existingWindow && !existingWindow.closed) {
    try {
      existingWindow.document.open();
      existingWindow.document.write(html);
      existingWindow.document.close();

      const runPrint = () => {
        try {
          existingWindow.focus();
          existingWindow.print();
        } catch (e) {
          console.warn('Print window focus/print failed, using iframe fallback', e);
          printHtmlDirectly(html);
        }
      };

      if (existingWindow.document.readyState === 'complete') {
        setTimeout(runPrint, 150);
      } else {
        existingWindow.addEventListener('load', () => setTimeout(runPrint, 150), { once: true });
        setTimeout(runPrint, 500);
      }
      return true;
    } catch (e) {
      console.warn('Writing to existing window failed, fallback to iframe print', e);
      existingWindow.close();
    }
  }

  // If no existing window or it failed, try opening a new one
  try {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      const runPrint = () => {
        printWindow.focus();
        printWindow.print();
      };

      if (printWindow.document.readyState === 'complete') {
        setTimeout(runPrint, 150);
      } else {
        printWindow.addEventListener('load', () => setTimeout(runPrint, 150), { once: true });
        setTimeout(runPrint, 500);
      }
      return true;
    }
  } catch (e) {
    console.warn('Popup blocked, falling back to direct iframe print', e);
  }

  // Popup was blocked by browser: fallback to hidden iframe printing
  return printHtmlDirectly(html);
}

/** Prints HTML directly via a hidden iframe without triggering popup blockers. */
export function printHtmlDirectly(html: string): boolean {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return false;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const doPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Iframe print error', err);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    };

    if (doc.readyState === 'complete') {
      setTimeout(doPrint, 200);
    } else {
      iframe.addEventListener('load', () => setTimeout(doPrint, 200), { once: true });
      setTimeout(doPrint, 600);
    }
    return true;
  } catch (err) {
    console.error('Direct print failed', err);
    return false;
  }
}
