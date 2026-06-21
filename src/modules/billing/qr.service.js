const QRCode = require('qrcode');

class QRService {
  /**
   * Generate a UPI QR code pre-loaded with amount
   * Standard UPI URI: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
   */
  async generateUPIQR({ upiId, payeeName, amount, note }) {
    const upiURI = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note || 'Payment')}`;
    const base64 = await QRCode.toDataURL(upiURI, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 2
    });
    // toDataURL returns "data:image/png;base64,<data>" — strip the prefix
    return base64.replace(/^data:image\/png;base64,/, '');
  }

  /**
   * Generate a blank UPI QR (no amount) — customer enters amount manually
   */
  async generateBlankUPIQR({ upiId, payeeName }) {
    const upiURI = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&cu=INR`;
    const base64 = await QRCode.toDataURL(upiURI, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 2
    });
    return base64.replace(/^data:image\/png;base64,/, '');
  }
}

module.exports = new QRService();
