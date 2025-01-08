// Configurazione Gun
const gun = Gun({
  peers: [
    "https://gun-relay.scobrudot.dev/gun",
    "https://peer.wallie.io/gun",
    "https://ruling-mastodon-improved.ngrok-free.app/gun",
    "https://gun-manhattan.herokuapp.com/gun"
  ],
  localStorage: false,
  radisk: false,
});

const user = gun.user();

// Debug della connessione
gun.on("hi", (peer) => {
  console.log("Peer connesso:", peer);
});

gun.on("bye", (peer) => {
  console.error("Peer disconnesso:", peer);
  // Riprova a connetterti dopo un po'
  setTimeout(() => {
    console.log("Tentativo riconnessione a:", peer.url);
    gun.opt({peers: [peer.url]});
  }, 10000);
});

gun.on("auth", (ack) => {
  console.log("Autenticazione:", ack);
});

// Gestione errori di rete
window.addEventListener('online', () => {
  console.log('Connessione ripristinata, riconnetto i peer...');
  gun.opt({peers: [
    "https://gun-relay.scobrudot.dev/gun",
    "https://peer.wallie.io/gun",
    "https://ruling-mastodon-improved.ngrok-free.app/gun",
    "https://gun-manhattan.herokuapp.com/gun",
  ]});
});

const config = {
  gun: {
    peers: [
    "https://gun-relay.scobrudot.dev/gun",
    "https://peer.wallie.io/gun",
    "https://ruling-mastodon-improved.ngrok-free.app/gun",
    "https://gun-manhattan.herokuapp.com/gun"
    ]
  },
  radio: {
    stationId: "demo",
    apiEndpoint: "https://public.radio.co/api/v2",
    pollInterval: 30000,
  },
};
