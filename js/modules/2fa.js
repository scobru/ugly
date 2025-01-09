// Importa la libreria otplib
const { authenticator } = window.otplib;
const QRCode = window.QRCode;

// Riferimenti alle variabili globali
const user = window.user;
const gun = window.gun;

// Aggiungi il contenuto HTML
document.getElementById("2fa-tab").innerHTML = `
  <section>
    <h2>Autenticazione a Due Fattori</h2>
    <div id="2fa-setup" style="margin: 10px 0;">
      <button id="enable2FABtn" onclick="window.setup2FA()">🔐 Attiva 2FA</button>
      <div id="qrcode-container" style="display: none; margin: 20px 0;">
        <img id="qrcode" alt="QR Code 2FA">
        <p>Scansiona questo codice QR con la tua app di autenticazione (Google Authenticator, Authy, ecc.)</p>
        <div style="margin-top: 10px;">
          <input type="text" id="verificationCode" placeholder="Codice di verifica">
          <button onclick="window.verify2FASetup()">✅ Verifica</button>
        </div>
      </div>
    </div>
    <div id="2fa-status" style="margin-top: 20px;"></div>
  </section>
`;

// Classe per gestire l'autenticazione a due fattori
class TwoFactorAuth {
  constructor() {
    this.gun = gun;
    authenticator.options = { window: 1 };
    this.checkStatus();
  }

  // Controlla lo stato del 2FA
  async checkStatus() {
    if (!user.is) return;
    
    const status = document.getElementById("2fa-status");
    const setupDiv = document.getElementById("2fa-setup");
    
    try {
      const secret = await this.getSecret(user.is.pub);
      if (secret) {
        status.innerHTML = '🟢 2FA è attivo sul tuo account';
        setupDiv.style.display = 'none';
      } else {
        status.innerHTML = '🔴 2FA non è attivo sul tuo account';
        setupDiv.style.display = 'block';
      }
    } catch (error) {
      console.error('Errore verifica stato 2FA:', error);
      status.innerHTML = '⚠️ Errore verifica stato 2FA';
    }
  }

  // Genera un nuovo segreto 2FA
  generateSecret(userId) {
    const secret = authenticator.generateSecret();
    this.gun.get('users').get(userId).get('2fa').put({ secret: secret });
    return secret;
  }

  // Ottiene il segreto 2FA di un utente
  getSecret(userId) {
    return new Promise((resolve) => {
      this.gun.get('users').get(userId).get('2fa').get('secret').once(secret => {
        resolve(secret);
      });
    });
  }

  // Genera un codice 2FA
  async generateCode(userId) {
    const secret = await this.getSecret(userId);
    return authenticator.generate(secret);
  }

  // Verifica un codice 2FA
  async verifyCode(userId, token) {
    const secret = await this.getSecret(userId);
    return authenticator.check(token, secret);
  }

  // Genera un codice QR
  async generateQRCode(userId, serviceName = 'HUGLY') {
    const secret = await this.getSecret(userId);
    return new Promise((resolve, reject) => {
      const otpauth = `otpauth://totp/${serviceName}:${userId}?secret=${secret}&issuer=${serviceName}`;
      QRCode.toDataURL(otpauth, (err, url) => {
        if (err) {
          console.error('Errore generazione QR Code:', err);
          reject(err);
          return;
        }
        resolve(url);
      });
    });
  }
}

// Istanza singleton
const twoFactorAuth = new TwoFactorAuth();

// Funzione per iniziare il setup del 2FA
async function setup2FA() {
  if (!user.is) {
    alert('Devi essere autenticato per attivare il 2FA');
    return;
  }

  try {
    // Genera un nuovo segreto
    const secret = twoFactorAuth.generateSecret(user.is.pub);
    
    // Genera e mostra il QR code
    const qrUrl = await twoFactorAuth.generateQRCode(user.is.pub);
    const qrcodeContainer = document.getElementById('qrcode-container');
    const qrcodeImg = document.getElementById('qrcode');
    
    qrcodeImg.src = qrUrl;
    qrcodeContainer.style.display = 'block';
    
    window.addAmbientSound({ type: 'success' });
  } catch (error) {
    console.error('Errore setup 2FA:', error);
    alert('Errore durante il setup del 2FA');
  }
}

// Funzione per verificare il setup del 2FA
async function verify2FASetup() {
  if (!user.is) return;

  const code = document.getElementById('verificationCode').value;
  if (!code) {
    alert('Inserisci il codice di verifica');
    return;
  }

  try {
    const isValid = await twoFactorAuth.verifyCode(user.is.pub, code);
    if (isValid) {
      alert('2FA attivato con successo!');
      window.addAmbientSound({ type: 'success' });
      twoFactorAuth.checkStatus();
    } else {
      alert('Codice non valido. Riprova.');
      window.addAmbientSound({ type: 'error' });
    }
  } catch (error) {
    console.error('Errore verifica 2FA:', error);
    alert('Errore durante la verifica del 2FA');
  }
}

// Rendi le funzioni disponibili globalmente
window.setup2FA = setup2FA;
window.verify2FASetup = verify2FASetup;

// Esporta l'istanza singleton
export default twoFactorAuth; 