// ============================================
// QR CODE MODULE
// ============================================
// Generate QR code for student
function generateQR(studentId, name) {
    const data = JSON.stringify({ id: studentId, name: name });
    // Use qrcode library
    if (typeof QRCode !== 'undefined') {
        const qrContainer = document.getElementById('qrcode');
        if (qrContainer) {
            new QRCode(qrContainer, {
                text: data,
                width: 200,
                height: 200,
                colorDark: '#008751',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }
}
window.qr = { generateQR };
