const express = require('express');
const QRCode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const os = require('os');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to find this device's active local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '127.0.0.1';
}

const deviceIp = getLocalIP();
let currentActiveDestination = `http://${deviceIp}:8080`; // Default app target

// 1. Endpoint for your app to report its updated IP/port configuration
app.post('/update-ip', (req, res) => {
    const { newDestination } = req.body;
    if (!newDestination) {
        return res.status(400).send({ error: 'Missing newDestination parameter' });
    }
    currentActiveDestination = newDestination;
    console.log(`\n[Network Update] Redirect target changed to: ${currentActiveDestination}`);
    res.send({ success: true, activeDestination: currentActiveDestination });
});

// 2. The permanent redirect route (matches root base URL directly)
app.get('/', (req, res) => {
    console.log(`[Scan Event] QR code scanned. Redirecting user to -> ${currentActiveDestination}`);
    res.redirect(currentActiveDestination);
});

// Start the server and generate the QR code into C:\Projects\sixnations-predictor\public\dynamic-qr-router\
app.listen(PORT, async () => {
    const serverUrl = `http://${deviceIp}:${PORT}/`;
    
    console.log(`----------------------------------------------------`);
    console.log(`🚀 Dynamic Router is running live!`);
    console.log(`Network Access: ${serverUrl}`);
    console.log(`Current Target: ${currentActiveDestination}`);
    console.log(`----------------------------------------------------`);
    console.log(`\n📱 Scan this QR code to test the dynamic redirect:\n`);

    qrcodeTerminal.generate(serverUrl, { small: true });

    try {
        const targetPublicDir = path.join(__dirname, 'public', 'dynamic-qr-router');

        if (!fs.existsSync(targetPublicDir)) {
            fs.mkdirSync(targetPublicDir, { recursive: true });
        }

        const filePath = path.join(targetPublicDir, 'flexible-qr-code.png');
        await QRCode.toFile(filePath, serverUrl, {
            color: { dark: '#000000', light: '#ffffff' }
        });
        console.log(`\n💾 Saved permanent QR code image directly to: ${filePath}`);
    } catch (err) {
        console.error('Failed to save QR code image:', err);
    }
});