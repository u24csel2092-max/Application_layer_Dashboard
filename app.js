/* =====================================================
   APPLICATION & TRANSPORT LAYER PROTOCOL VISUALIZER
   BTech Computer Networks Project — app.js
   ===================================================== */

"use strict";

const $ = id => document.getElementById(id);

// ─────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─────────────────────────────────────────────────────
// TOP NAV — section switching
// ─────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.section;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));
    $('sec-' + target).classList.add('active-section');
  });
});

// ─────────────────────────────────────────────────────
// PROTO SELECTORS — tab switching inside each section
// ─────────────────────────────────────────────────────
document.querySelectorAll('.proto-selector').forEach(selector => {
  selector.querySelectorAll('.proto-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.section') || document.querySelector('.active-section');
      section.querySelectorAll('.proto-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const proto = btn.dataset.proto;
      section.querySelectorAll('.proto-panel').forEach(p => p.classList.remove('active-panel'));
      const target = section.querySelector(`#proto-${proto}`);
      if (target) target.classList.add('active-panel');
    });
  });
});

// ─────────────────────────────────────────────────────
// GENERIC PROTOCOL VISUALIZER ENGINE
// ─────────────────────────────────────────────────────
class ProtocolVisualizer {
  constructor(opts) {
    this.steps = opts.steps || [];
    this.msgContainer = opts.msgContainer;
    this.stepCounter = opts.stepCounter;
    this.controls = opts.controls;
    this.prevBtn = opts.prevBtn;
    this.nextBtn = opts.nextBtn;
    this.pauseBtn = opts.pauseBtn;
    this.replayBtn = opts.replayBtn;
    this.onStep = opts.onStep || null;
    this.current = -1;
    this.paused = false;
    this.timer = null;
    this.interval = opts.interval || 1800;
    this._bindControls();
  }

  _bindControls() {
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => { this.prev(); this.pauseAnim(); });
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => { this.next(); this.pauseAnim(); });
    if (this.pauseBtn) this.pauseBtn.addEventListener('click', () => this.togglePause());
    if (this.replayBtn) this.replayBtn.addEventListener('click', () => this.replay());
  }

  setSteps(steps) {
    this.steps = steps;
    this.current = -1;
    this.paused = false;
    this.msgContainer.innerHTML = '';
    if (this.controls) this.controls.classList.remove('hidden');
    this.advance();
    this.startAuto();
  }

  advance() {
    if (this.current < this.steps.length - 1) {
      this.current++;
      this._renderStep(this.current);
      return true;
    }
    return false;
  }

  prev() {
    if (this.current > 0) {
      this.current--;
      this._highlightStep(this.current);
    }
  }

  next() {
    this.advance();
  }

  replay() {
    clearInterval(this.timer);
    this.current = -1;
    this.paused = false;
    this.msgContainer.innerHTML = '';
    if (this.pauseBtn) this.pauseBtn.textContent = '⏸ Pause';
    this.advance();
    this.startAuto();
  }

  pauseAnim() {
    this.paused = true;
    clearInterval(this.timer);
    if (this.pauseBtn) this.pauseBtn.textContent = '▶ Resume';
  }

  togglePause() {
    if (this.paused) {
      this.paused = false;
      if (this.pauseBtn) this.pauseBtn.textContent = '⏸ Pause';
      this.startAuto();
    } else {
      this.pauseAnim();
    }
  }

  startAuto() {
    clearInterval(this.timer);
    if (this.steps.length <= 1) return;
    this.timer = setInterval(() => {
      if (!this.paused) {
        const ok = this.advance();
        if (!ok) clearInterval(this.timer);
      }
    }, this.interval);
  }

  _renderStep(idx) {
    const s = this.steps[idx];
    // Update counter
    if (this.stepCounter)
      this.stepCounter.textContent = `${idx + 1} / ${this.steps.length}`;

    // Deactivate all previous
    this.msgContainer.querySelectorAll('.msg-card').forEach(c => {
      c.classList.remove('active-msg');
      c.classList.add('done-msg');
    });

    // Create new card
    const card = document.createElement('div');
    card.className = 'msg-card active-msg';
    const dirClass = s.dir === 'client' ? 'dir-client' : s.dir === 'server' ? 'dir-server' : 'dir-info';
    card.innerHTML = `
      <div class="msg-head">
        <span class="msg-type-label">${esc(s.type)}</span>
        <span class="msg-dir ${dirClass}">${esc(s.direction)}</span>
      </div>
      <div class="msg-text">${esc(s.message)}</div>
      ${s.hint ? `<div class="msg-hint">💬 ${esc(s.hint)}</div>` : ''}
    `;
    this.msgContainer.appendChild(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (this.onStep) this.onStep(s, idx);
  }

  _highlightStep(idx) {
    const cards = this.msgContainer.querySelectorAll('.msg-card');
    cards.forEach((c, i) => {
      c.classList.remove('active-msg', 'done-msg');
      if (i < idx) c.classList.add('done-msg');
      else if (i === idx) c.classList.add('active-msg');
    });
    if (this.stepCounter)
      this.stepCounter.textContent = `${idx + 1} / ${this.steps.length}`;
    if (this.onStep) this.onStep(this.steps[idx], idx);
  }
}

// ─────────────────────────────────────────────────────
// DNS VISUALIZER
// ─────────────────────────────────────────────────────
function buildDnsSteps(host) {
  const ip = `93.${Math.floor(Math.random()*200)+10}.${Math.floor(Math.random()*200)}.${Math.floor(Math.random()*200)+10}`;
  return [
    {
      type: 'DNS Query (Recursive)', dir: 'client', direction: 'Client → DNS Server',
      message: `UDP Datagram\n  ID: 0xA4B2\n  QR: 0 (Query)\n  OPCODE: 0 (Standard)\n  Question: ${host} IN A\n  Port: 52218 → 53`,
      hint: 'Client sends a recursive DNS query for an A record via UDP on port 53'
    },
    {
      type: 'DNS Query Forwarded', dir: 'server', direction: 'Local DNS → Root Server',
      message: `UDP Datagram\n  ID: 0xA4B2\n  QR: 0 (Query)\n  Recursion Available: 1\n  Question: ${host} IN A\n  Forwarding to: Root Name Server (.)`,
      hint: 'Local DNS resolver forwards query up to root name servers'
    },
    {
      type: 'Root Referral Response', dir: 'server', direction: 'Root Server → Local DNS',
      message: `UDP Response\n  ID: 0xA4B2\n  QR: 1 (Response)\n  RCODE: 0 (NoError)\n  Authority: .com → ns1.verisign.com\n               ns2.verisign.com`,
      hint: 'Root server returns NS referral for the .com TLD zone'
    },
    {
      type: 'TLD Query → .com Server', dir: 'server', direction: 'Local DNS → TLD Server',
      message: `UDP Datagram\n  ID: 0xB1C3\n  QR: 0 (Query)\n  Question: ${host} IN A\n  Querying: .com TLD NS`,
      hint: 'Resolver queries the .com TLD name server'
    },
    {
      type: 'TLD Referral Response', dir: 'server', direction: 'TLD Server → Local DNS',
      message: `UDP Response\n  ID: 0xB1C3\n  QR: 1 (Response)\n  RCODE: 0\n  Authority: ${host.split('.').slice(1).join('.')} →\n    ns1.example-dns.net\n    ns2.example-dns.net`,
      hint: 'TLD server delegates to authoritative name servers for the domain'
    },
    {
      type: 'Authoritative DNS Response', dir: 'server', direction: 'Auth Server → Local DNS',
      message: `UDP Response\n  ID: 0xC4D5\n  QR: 1 (Response)\n  AA: 1 (Authoritative)\n  RCODE: 0 (NoError)\n  Answer Section:\n    ${host}  300 IN A  ${ip}\n  TTL: 300 seconds`,
      hint: 'Authoritative server returns the final A record with TTL'
    },
    {
      type: 'DNS Response to Client', dir: 'server', direction: 'DNS Server → Client',
      message: `UDP Response\n  ID: 0xA4B2\n  QR: 1 (Response)\n  RA: 1 (Recursion Available)\n  RCODE: 0 (NoError)\n  Answer:\n    ${host}  300 IN A  ${ip}\n\n  ✅ Resolved: ${host} → ${ip}`,
      hint: `DNS lookup complete. IP ${ip} will be used for TCP connection`
    }
  ];
}

const dnsViz = new ProtocolVisualizer({
  msgContainer: $('dnsMessages'),
  stepCounter: $('dnsStepCounter'),
  controls: $('dnsControls'),
  prevBtn: $('dnsPrev'),
  nextBtn: $('dnsNext'),
  pauseBtn: $('dnsPause'),
  replayBtn: $('dnsReplay'),
  interval: 1800,
  onStep: (s) => {
    const wire = $('dnsWire');
    wire.innerHTML = '';
    const dir = s.dir === 'client' ? '→' : '←';
    const color = s.dir === 'client' ? '#dbeafe' : '#d1fae5';
    const border = s.dir === 'client' ? '#93c5fd' : '#6ee7b7';
    wire.innerHTML = `
      <div style="background:${color};border:1px solid ${border};border-radius:10px;padding:8px 14px;text-align:center;animation:fadeUp .3s ease">
        <div style="font-size:18px">📦 ${dir}</div>
        <div style="font-size:11px;font-weight:700;margin-top:3px">${esc(s.type)}</div>
        <div style="font-size:9px;color:#64748b;margin-top:2px">Port 53 · UDP</div>
      </div>`;
  }
});

$('runDns').addEventListener('click', () => {
  const host = $('dnsInput').value.trim() || 'www.example.com';
  const statusEl = $('dnsStatus');
  statusEl.className = 'status-bar running';
  statusEl.textContent = `🔍 Resolving ${host}...`;
  statusEl.classList.remove('hidden');
  dnsViz.setSteps(buildDnsSteps(host));
  setTimeout(() => {
    statusEl.className = 'status-bar';
    statusEl.textContent = `✅ Resolution complete for ${host}`;
  }, 7 * 1800 + 500);
});

// ─────────────────────────────────────────────────────
// HTTP VISUALIZER
// ─────────────────────────────────────────────────────
function buildHttpSteps(rawUrl, method) {
  let url; try { url = new URL(rawUrl.includes('://') ? rawUrl : 'https://' + rawUrl); } catch { url = { hostname: 'example.com', pathname: '/' }; }
  const host = url.hostname;
  const path = url.pathname || '/';
  const port = rawUrl.startsWith('https') ? 443 : 80;
  const proto = rawUrl.startsWith('https') ? 'HTTPS/TLS' : 'HTTP/1.1';
  return [
    {
      type: 'DNS Lookup', dir: 'client', direction: 'Client → DNS Server',
      message: `DNS Query: ${host} IN A\nPort: 53 · UDP`,
      hint: 'First, the browser resolves the hostname to an IP via DNS'
    },
    {
      type: 'DNS Response', dir: 'server', direction: 'DNS Server → Client',
      message: `DNS Answer: ${host} → 93.184.216.34\nTTL: 3600s`,
      hint: 'IP address obtained, now TCP connection can be established'
    },
    {
      type: 'TCP SYN (3-Way Handshake)', dir: 'client', direction: 'Browser → Web Server',
      message: `TCP Segment\n  Flags: SYN\n  Seq: 1000\n  Source Port: 54321\n  Dest Port: ${port}\n  Window Size: 65535`,
      hint: 'Browser initiates TCP 3-way handshake to establish reliable connection'
    },
    {
      type: 'TCP SYN-ACK', dir: 'server', direction: 'Web Server → Browser',
      message: `TCP Segment\n  Flags: SYN, ACK\n  Seq: 5000\n  Ack: 1001\n  Window Size: 65535`,
      hint: 'Server acknowledges and sends its own SYN for bidirectional setup'
    },
    {
      type: 'TCP ACK (Connection Established)', dir: 'client', direction: 'Browser → Web Server',
      message: `TCP Segment\n  Flags: ACK\n  Seq: 1001\n  Ack: 5001\n\n  ✅ TCP Connection ESTABLISHED`,
      hint: 'TCP connection is fully established, ready for HTTP data'
    },
    {
      type: `HTTP ${method} Request`, dir: 'client', direction: 'Browser → Web Server',
      message: `${method} ${path} HTTP/1.1\nHost: ${host}\nUser-Agent: Mozilla/5.0\nAccept: text/html,application/xhtml+xml\nAccept-Encoding: gzip, deflate\nConnection: keep-alive\nCache-Control: no-cache\n`,
      hint: `HTTP ${method} request sent over the established TCP connection`
    },
    {
      type: 'HTTP 200 OK Response', dir: 'server', direction: 'Web Server → Browser',
      message: `HTTP/1.1 200 OK\nContent-Type: text/html; charset=UTF-8\nContent-Length: 4823\nServer: nginx/1.25.0\nDate: Fri, 02 Oct 2026 05:07:00 GMT\nCache-Control: max-age=3600\nConnection: keep-alive\n\n<!DOCTYPE html>\n<html>...</html>`,
      hint: 'Server responds with status 200 OK and HTML content'
    },
    {
      type: 'TCP FIN (Connection Close)', dir: 'client', direction: 'Browser → Web Server',
      message: `TCP Segment\n  Flags: FIN, ACK\n  Seq: 1500\n  Ack: 5500\n\n  Connection closing (4-way FIN handshake)`,
      hint: 'Browser initiates graceful TCP connection termination'
    }
  ];
}

const httpViz = new ProtocolVisualizer({
  msgContainer: $('httpMessages'),
  stepCounter: $('httpStepCounter'),
  controls: $('httpControls'),
  prevBtn: $('httpPrev'),
  nextBtn: $('httpNext'),
  pauseBtn: $('httpPause'),
  replayBtn: $('httpReplay'),
  interval: 1900,
  onStep: (s) => {
    const wire = $('httpWire');
    wire.innerHTML = '';
    const isClient = s.dir === 'client';
    const emoji = s.type.includes('TCP') ? '🔗' : s.type.includes('DNS') ? '🔍' : '📄';
    const color = isClient ? '#dbeafe' : '#d1fae5';
    const border = isClient ? '#93c5fd' : '#6ee7b7';
    wire.innerHTML = `
      <div style="background:${color};border:1px solid ${border};border-radius:10px;padding:8px 14px;text-align:center;animation:fadeUp .3s ease">
        <div style="font-size:20px">${emoji} ${isClient ? '→' : '←'}</div>
        <div style="font-size:11px;font-weight:700;margin-top:3px">${esc(s.type)}</div>
      </div>`;
  }
});

$('runHttp').addEventListener('click', () => {
  const url = $('httpInput').value.trim() || 'https://www.example.com/';
  const method = $('httpMethod').value;
  const statusEl = $('httpStatus');
  statusEl.className = 'status-bar running';
  statusEl.textContent = `📤 Sending ${method} request to ${url}...`;
  statusEl.classList.remove('hidden');
  httpViz.setSteps(buildHttpSteps(url, method));
  setTimeout(() => {
    statusEl.className = 'status-bar';
    statusEl.textContent = `✅ HTTP ${method} exchange completed · Response: 200 OK`;
  }, 8 * 1900 + 500);
});

// ─────────────────────────────────────────────────────
// SMTP VISUALIZER
// ─────────────────────────────────────────────────────
function buildSmtpSteps(from, to, subject) {
  const domain = from.includes('@') ? from.split('@')[1] : 'mail.example.com';
  return [
    {
      type: 'TCP Connection Established', dir: 'client', direction: 'Mail Client → SMTP Server',
      message: `TCP SYN → SYN-ACK → ACK\n  Client: ${from.split('@')[0]}-pc:53241\n  Server: mail.${domain}:587\n\n  ✅ TCP Connection ESTABLISHED`,
      hint: 'SMTP runs over TCP; connection must be established first'
    },
    {
      type: '220 Service Ready', dir: 'server', direction: 'SMTP Server → Client',
      message: `220 mail.${domain} ESMTP Postfix\n    (Server announces itself and SMTP version)`,
      hint: '220 means SMTP service is ready to accept commands'
    },
    {
      type: 'EHLO — Client Greeting', dir: 'client', direction: 'Client → Server',
      message: `EHLO ${domain}\n\n  (Extended HELO - identifies client and requests\n   list of server capabilities)`,
      hint: 'EHLO/HELO is the mandatory greeting that starts the SMTP session'
    },
    {
      type: '250 Capabilities List', dir: 'server', direction: 'Server → Client',
      message: `250-mail.${domain} Hello ${domain}\n250-SIZE 52428800\n250-8BITMIME\n250-AUTH LOGIN PLAIN\n250-STARTTLS\n250 SMTPUTF8`,
      hint: '250 OK — server lists its capabilities like AUTH, STARTTLS, SIZE limits'
    },
    {
      type: 'MAIL FROM — Sender', dir: 'client', direction: 'Client → Server',
      message: `MAIL FROM:<${from}> SIZE=1024\n\n  (Specifies the envelope sender address)`,
      hint: 'The envelope sender is set; this may differ from the From: header'
    },
    {
      type: '250 Sender OK', dir: 'server', direction: 'Server → Client',
      message: `250 2.1.0 Ok\n    (Server accepts the sender address)`,
      hint: 'Server confirms the sender address is acceptable'
    },
    {
      type: 'RCPT TO — Recipient', dir: 'client', direction: 'Client → Server',
      message: `RCPT TO:<${to}>\n\n  (Specifies the envelope recipient address)`,
      hint: 'Multiple RCPT TO commands can be issued for multiple recipients'
    },
    {
      type: '250 Recipient OK', dir: 'server', direction: 'Server → Client',
      message: `250 2.1.5 Ok\n    (Server will accept mail for this recipient)`,
      hint: 'Server confirms it will deliver mail to this recipient'
    },
    {
      type: 'DATA Command', dir: 'client', direction: 'Client → Server',
      message: `DATA\n\n  (Client is about to send message content)`,
      hint: 'DATA command switches server to message-receiving mode'
    },
    {
      type: '354 Start Input', dir: 'server', direction: 'Server → Client',
      message: `354 End data with <CR><LF>.<CR><LF>\n    (Server ready to receive message body)`,
      hint: 'Message body must end with a single dot on its own line'
    },
    {
      type: 'Message Headers + Body', dir: 'client', direction: 'Client → Server',
      message: `From: ${from}\nTo: ${to}\nSubject: ${subject}\nDate: Fri, 02 Oct 2026 10:37:00 +0530\nMIME-Version: 1.0\nContent-Type: text/plain; charset=UTF-8\n\nHello Professor,\n\nPlease find my Computer Networks assignment attached.\n\nRegards\n.\n  (Single dot ends message body)`,
      hint: 'Email headers followed by blank line then body, terminated with solo dot'
    },
    {
      type: '250 Message Accepted', dir: 'server', direction: 'Server → Client',
      message: `250 2.0.0 Ok: queued as AB12CD\n    (Server accepted message for delivery)\n\n  ✅ Email successfully sent!`,
      hint: 'Message is queued for delivery to the recipient MTA'
    },
    {
      type: 'QUIT', dir: 'client', direction: 'Client → Server',
      message: `QUIT\n\n  (Client ends the SMTP session)`,
      hint: 'QUIT gracefully closes the SMTP session'
    },
    {
      type: '221 Goodbye', dir: 'server', direction: 'Server → Client',
      message: `221 2.0.0 Bye\n    (TCP connection closed)\n\n  📬 Email delivered to queue successfully`,
      hint: 'Session ends; TCP connection is closed with FIN handshake'
    }
  ];
}

const smtpViz = new ProtocolVisualizer({
  msgContainer: $('smtpMessages'),
  stepCounter: $('smtpStepCounter'),
  controls: $('smtpControls'),
  prevBtn: $('smtpPrev'),
  nextBtn: $('smtpNext'),
  pauseBtn: $('smtpPause'),
  replayBtn: $('smtpReplay'),
  interval: 1700,
  onStep: (s) => {
    const wire = $('smtpWire');
    wire.innerHTML = '';
    const isClient = s.dir === 'client';
    const color = isClient ? '#cffafe' : '#d1fae5';
    const border = isClient ? '#67e8f9' : '#6ee7b7';
    wire.innerHTML = `
      <div style="background:${color};border:1px solid ${border};border-radius:10px;padding:8px 14px;text-align:center;animation:fadeUp .3s ease">
        <div style="font-size:18px">✉️ ${isClient ? '→' : '←'}</div>
        <div style="font-size:11px;font-weight:700;margin-top:3px">${esc(s.type)}</div>
        <div style="font-size:9px;color:#64748b;margin-top:2px">Port 587 · TCP</div>
      </div>`;
  }
});

$('runSmtp').addEventListener('click', () => {
  const from = $('smtpFrom').value.trim() || 'student@college.edu';
  const to = $('smtpTo').value.trim() || 'professor@university.edu';
  const subj = $('smtpSubj').value.trim() || 'Assignment';
  const statusEl = $('smtpStatus');
  statusEl.className = 'status-bar running';
  statusEl.textContent = `📤 Sending email from ${from} to ${to}...`;
  statusEl.classList.remove('hidden');
  smtpViz.setSteps(buildSmtpSteps(from, to, subj));
  setTimeout(() => {
    statusEl.className = 'status-bar';
    statusEl.textContent = `✅ Email delivered successfully to ${to}`;
  }, 14 * 1700 + 500);
});

// ─────────────────────────────────────────────────────
// TCP VISUALIZER — animated packet flying
// ─────────────────────────────────────────────────────
const TCP_STEPS = [
  {
    label: 'SYN', meta: 'Seq=1000', dir: 'forward', pktClass: 'pkt-syn',
    clientState: 'SYN_SENT', serverState: 'LISTEN', connBadge: 'connecting',
    title: 'Step 1: SYN — Client → Server',
    direction: 'Client → Server', dirClass: 'client-dir',
    desc: 'Client initiates the 3-Way Handshake by sending a TCP segment with the SYN flag set. It chooses an Initial Sequence Number (ISN=1000) to begin tracking bytes.',
    fields: [
      { name: 'Source Port', val: '52418' },
      { name: 'Dest Port', val: '80 (HTTP)' },
      { name: 'Seq Number', val: '1000 (ISN)' },
      { name: 'Ack Number', val: '0 (none)' },
      { name: 'Flags', val: 'SYN=1' },
      { name: 'Window Size', val: '65535' },
      { name: 'Header Length', val: '20 Bytes' },
      { name: 'Checksum', val: '0x4B2A' }
    ],
    eduTitle: '3-Way Handshake: Step 1',
    eduBody: 'SYN (Synchronize) sets the starting sequence number. The receiver will use Ack = Seq+1 to confirm it received this segment.'
  },
  {
    label: 'SYN-ACK', meta: 'Seq=5000\nAck=1001', dir: 'reverse', pktClass: 'pkt-synack',
    clientState: 'SYN_RCVD', serverState: 'SYN_RCVD', connBadge: 'connecting',
    title: 'Step 2: SYN-ACK — Server → Client',
    direction: 'Server → Client', dirClass: 'server-dir',
    desc: 'Server acknowledges the client SYN (Ack=1001) and simultaneously sends its own SYN with Seq=5000, establishing a bidirectional sequence number agreement.',
    fields: [
      { name: 'Source Port', val: '80 (HTTP)' },
      { name: 'Dest Port', val: '52418' },
      { name: 'Seq Number', val: '5000 (ISN)' },
      { name: 'Ack Number', val: '1001 (Seq+1)' },
      { name: 'Flags', val: 'SYN=1 ACK=1' },
      { name: 'Window Size', val: '65535' },
      { name: 'Header Length', val: '20 Bytes' },
      { name: 'Checksum', val: '0x9C4F' }
    ],
    eduTitle: '3-Way Handshake: Step 2',
    eduBody: 'SYN-ACK confirms the client\'s SYN and proposes the server\'s own starting sequence number. Both sides now know each other\'s ISN.'
  },
  {
    label: 'ACK', meta: 'Seq=1001\nAck=5001', dir: 'forward', pktClass: 'pkt-ack',
    clientState: 'ESTABLISHED', serverState: 'ESTABLISHED', connBadge: 'established',
    title: 'Step 3: ACK — Handshake Complete',
    direction: 'Client → Server', dirClass: 'client-dir',
    desc: 'Client sends the final ACK (Ack=5001) completing the 3-Way Handshake. Connection is now ESTABLISHED. Both sides can send data.',
    fields: [
      { name: 'Source Port', val: '52418' },
      { name: 'Dest Port', val: '80 (HTTP)' },
      { name: 'Seq Number', val: '1001' },
      { name: 'Ack Number', val: '5001 (Seq+1)' },
      { name: 'Flags', val: 'ACK=1' },
      { name: 'Window Size', val: '65535' },
      { name: 'Header Length', val: '20 Bytes' },
      { name: 'Checksum', val: '0x1D3A' }
    ],
    eduTitle: '✅ Connection ESTABLISHED',
    eduBody: 'The 3-way handshake is complete: SYN → SYN-ACK → ACK. A full-duplex reliable channel is now open between client and server.'
  },
  {
    label: 'HTTP GET', meta: 'Seq=1001\nLen=512', dir: 'forward', pktClass: 'pkt-data',
    clientState: 'ESTABLISHED', serverState: 'ESTABLISHED', connBadge: 'established',
    title: 'Step 4: Data Transfer — HTTP GET Request',
    direction: 'Client → Server', dirClass: 'client-dir',
    desc: 'Client sends the HTTP GET request encapsulated inside a TCP segment. The data is reliably transmitted using the established sequence numbers.',
    fields: [
      { name: 'Source Port', val: '52418' },
      { name: 'Dest Port', val: '80' },
      { name: 'Seq Number', val: '1001' },
      { name: 'Ack Number', val: '5001' },
      { name: 'Flags', val: 'PSH=1 ACK=1' },
      { name: 'Payload', val: 'HTTP GET 512B' },
      { name: 'Window Size', val: '65535' },
      { name: 'Checksum', val: '0x7E2F' }
    ],
    eduTitle: 'Data Transfer with PSH Flag',
    eduBody: 'PSH (Push) flag tells the receiver to deliver data to the application immediately without buffering. Sequence numbers track every byte.'
  },
  {
    label: 'ACK', meta: 'Ack=1513', dir: 'reverse', pktClass: 'pkt-ack',
    clientState: 'ESTABLISHED', serverState: 'ESTABLISHED', connBadge: 'established',
    title: 'Step 5: ACK — Server Acknowledges Data',
    direction: 'Server → Client', dirClass: 'server-dir',
    desc: 'Server sends ACK=1513 (1001+512) confirming it received all 512 bytes of the HTTP request. Flow control window may be updated.',
    fields: [
      { name: 'Source Port', val: '80' },
      { name: 'Dest Port', val: '52418' },
      { name: 'Seq Number', val: '5001' },
      { name: 'Ack Number', val: '1513' },
      { name: 'Flags', val: 'ACK=1' },
      { name: 'Window Size', val: '65535' },
      { name: 'Header Length', val: '20 Bytes' },
      { name: 'Checksum', val: '0xAA11' }
    ],
    eduTitle: 'Cumulative Acknowledgment',
    eduBody: 'TCP uses cumulative ACKs. ACK=1513 means "I received all bytes up to and including 1512, send me byte 1513 next."'
  },
  {
    label: 'HTTP 200', meta: 'Seq=5001\nLen=4823', dir: 'reverse', pktClass: 'pkt-data',
    clientState: 'ESTABLISHED', serverState: 'ESTABLISHED', connBadge: 'established',
    title: 'Step 6: Data Transfer — HTTP 200 Response',
    direction: 'Server → Client', dirClass: 'server-dir',
    desc: 'Server sends the HTTP 200 OK response with HTML content. Large responses may be split into multiple TCP segments (segmentation).',
    fields: [
      { name: 'Source Port', val: '80' },
      { name: 'Dest Port', val: '52418' },
      { name: 'Seq Number', val: '5001' },
      { name: 'Ack Number', val: '1513' },
      { name: 'Flags', val: 'PSH=1 ACK=1' },
      { name: 'Payload', val: 'HTTP 200 + HTML' },
      { name: 'Window Size', val: '65535' },
      { name: 'Checksum', val: '0x3D5E' }
    ],
    eduTitle: 'TCP Segmentation',
    eduBody: 'If the HTTP response exceeds MSS (Maximum Segment Size, typically 1460 bytes), TCP splits it into multiple segments, each independently acknowledged.'
  },
  {
    label: 'FIN', meta: 'Seq=1513\nFIN=1', dir: 'forward', pktClass: 'pkt-fin',
    clientState: 'FIN_WAIT_1', serverState: 'CLOSE_WAIT', connBadge: 'closed',
    title: 'Step 7: FIN — Connection Close',
    direction: 'Client → Server (4-Way Close)', dirClass: 'client-dir',
    desc: 'Client initiates graceful TCP connection close with FIN flag. Server responds with ACK, then sends its own FIN. Client sends final ACK → connection fully closed.',
    fields: [
      { name: 'Source Port', val: '52418' },
      { name: 'Dest Port', val: '80' },
      { name: 'Seq Number', val: '1513' },
      { name: 'Ack Number', val: '9824' },
      { name: 'Flags', val: 'FIN=1 ACK=1' },
      { name: 'Window Size', val: '65535' },
      { name: 'Header Length', val: '20 Bytes' },
      { name: 'Checksum', val: '0x6C87' }
    ],
    eduTitle: '4-Way Connection Close',
    eduBody: 'TCP closes with 4 steps: FIN → ACK → FIN → ACK. This allows both sides to independently finish sending data before closing (half-close support).'
  }
];

let tcpCurrentStep = 0;
let tcpPaused = false;
let tcpTimer = null;
let tcpSpeed = 1800;

function renderTcpTimeline(idx) {
  const tl = $('tcpTimeline');
  tl.innerHTML = TCP_STEPS.map((_, i) =>
    `<span class="${i <= idx ? 't-active' : ''}"></span>`
  ).join('');
}

function renderTcpStep(idx) {
  const s = TCP_STEPS[idx];
  $('tcpStageTitle').textContent = s.title;
  $('tcpStepBadge').textContent = `Step ${idx + 1}/${TCP_STEPS.length}`;
  $('tcpConnBadge').textContent = s.connBadge === 'established' ? 'ESTABLISHED' : s.connBadge === 'closed' ? 'CLOSING' : 'CONNECTING';
  $('tcpConnBadge').className = `conn-badge ${s.connBadge}`;

  // Update node states
  $('tcpClientState').textContent = s.clientState;
  $('tcpClientState').className = `node-state-badge state-${s.connBadge === 'established' ? 'established' : s.connBadge === 'closed' ? 'close' : 'synsent'}`;
  $('tcpServerState').textContent = s.serverState;
  $('tcpServerState').className = `node-state-badge state-${s.serverState === 'LISTEN' ? 'listen' : s.connBadge === 'established' ? 'established' : 'synsent'}`;

  // Animate packet
  animateTcpPacket(s);
  renderTcpTimeline(idx);

  // Inspector
  $('tcpInspTitle').textContent = s.title;
  $('tcpInspDir').textContent = s.direction;
  $('tcpInspDir').className = `insp-direction ${s.dirClass}`;
  $('tcpInspDesc').textContent = s.desc;
  $('tcpFieldGrid').innerHTML = s.fields.map(f =>
    `<div class="field-item"><div class="field-name">${esc(f.name)}</div><div class="field-val">${esc(f.val)}</div></div>`
  ).join('');
  $('tcpEduTitle').textContent = s.eduTitle;
  $('tcpEduBody').textContent = s.eduBody;
}

function animateTcpPacket(s) {
  const pkt = $('tcpPacket');
  const stage = $('tcpStage');
  const stageRect = stage.getBoundingClientRect();
  const wireEl = $('tcpWireRegion');
  const wireRect = wireEl.getBoundingClientRect();

  pkt.className = `fly-packet ${s.pktClass}`;
  $('tcpPktLabel').textContent = s.label;
  $('tcpPktMeta').textContent = s.meta;
  pkt.classList.remove('hidden');

  const isForward = s.dir === 'forward';
  const startPct = isForward ? '5%' : '95%';
  const endPct = isForward ? '95%' : '5%';

  // Position vertically based on forward/reverse track
  const topPct = isForward ? '35%' : '70%';
  pkt.style.left = startPct;
  pkt.style.top = topPct;
  pkt.style.opacity = '1';

  requestAnimationFrame(() => {
    setTimeout(() => {
      pkt.style.left = endPct;
      // Pulse destination node
      setTimeout(() => {
        const node = isForward ? $('tcpServerNode') : $('tcpClientNode');
        node.classList.add('node-active');
        setTimeout(() => node.classList.remove('node-active'), 600);
      }, 620);
    }, 50);
  });
}

function tcpAdvance() {
  if (tcpCurrentStep < TCP_STEPS.length - 1) {
    tcpCurrentStep++;
    renderTcpStep(tcpCurrentStep);
    return true;
  }
  return false;
}

function startTcpAuto() {
  clearInterval(tcpTimer);
  tcpTimer = setInterval(() => {
    if (!tcpPaused) {
      if (!tcpAdvance()) clearInterval(tcpTimer);
    }
  }, tcpSpeed);
}

// Initialize TCP
renderTcpStep(0);
startTcpAuto();

$('tcpPrev').addEventListener('click', () => {
  tcpPaused = true;
  $('tcpPlayPause').textContent = '▶ Resume';
  if (tcpCurrentStep > 0) { tcpCurrentStep--; renderTcpStep(tcpCurrentStep); }
});
$('tcpNext').addEventListener('click', () => {
  tcpPaused = true;
  $('tcpPlayPause').textContent = '▶ Resume';
  tcpAdvance();
});
$('tcpPlayPause').addEventListener('click', () => {
  tcpPaused = !tcpPaused;
  $('tcpPlayPause').textContent = tcpPaused ? '▶ Resume' : '⏸ Pause';
  if (!tcpPaused) startTcpAuto();
});
$('tcpReplay').addEventListener('click', () => {
  clearInterval(tcpTimer);
  tcpCurrentStep = 0;
  tcpPaused = false;
  $('tcpPlayPause').textContent = '⏸ Pause';
  renderTcpStep(0);
  startTcpAuto();
});
$('tcpSpeed1x').addEventListener('click', () => {
  tcpSpeed = 1800; $('tcpSpeed1x').classList.add('active'); $('tcpSpeed2x').classList.remove('active');
  if (!tcpPaused) startTcpAuto();
});
$('tcpSpeed2x').addEventListener('click', () => {
  tcpSpeed = 900; $('tcpSpeed2x').classList.add('active'); $('tcpSpeed1x').classList.remove('active');
  if (!tcpPaused) startTcpAuto();
});

// ─────────────────────────────────────────────────────
// UDP VISUALIZER
// ─────────────────────────────────────────────────────
const UDP_STEPS = [
  {
    label: 'UDP Datagram', meta: 'Seq=—\nNo Conn.', dir: 'forward',
    title: 'UDP — No Connection Setup Required',
    desc: 'UDP sends data immediately without any connection establishment. There is NO SYN, NO SYN-ACK, NO ACK handshake. Datagram is fired directly to receiver.',
    recvState: 'WAITING',
    fields: [
      { name: 'Source Port', val: '5500 (Ephemeral)' },
      { name: 'Dest Port', val: '5004 (RTP)' },
      { name: 'Length', val: '1400 Bytes' },
      { name: 'Checksum', val: '0xF3A1 (opt)' }
    ],
    eduTitle: 'UDP Header: Only 8 Bytes!',
    eduBody: 'UDP\'s entire header is just 4 fields × 2 bytes = 8 bytes fixed. Compare this to TCP\'s 20-60 byte header. This minimal overhead makes UDP significantly faster.'
  },
  {
    label: 'VIDEO', meta: 'Frame #001\n720p', dir: 'forward',
    title: 'Video Frame Datagram — No ACK Sent Back',
    desc: 'A video frame is encapsulated in a UDP datagram and sent. The receiver does NOT send any acknowledgment. If this packet is lost, it is NOT retransmitted — the frame is simply dropped.',
    recvState: 'RECEIVED',
    fields: [
      { name: 'Source Port', val: '5500' },
      { name: 'Dest Port', val: '5004' },
      { name: 'Payload', val: 'H.264 Frame 720p' },
      { name: 'Checksum', val: '0x1B2C' }
    ],
    eduTitle: '⚡ Fire and Forget!',
    eduBody: 'UDP sends datagrams and immediately moves on. No waiting for ACK means much lower latency — critical for real-time applications like video calls and gaming.'
  },
  {
    label: 'AUDIO', meta: 'PCM Audio\n44.1kHz', dir: 'forward',
    title: 'Audio Datagram — Out-of-Order Possible',
    desc: 'Audio data is streamed continuously as UDP datagrams. Packets may arrive out of order (no TCP ordering guarantee). The application buffers and reorders them with timestamps.',
    recvState: 'RECEIVED',
    fields: [
      { name: 'Source Port', val: '5500' },
      { name: 'Dest Port', val: '5006 (Audio)' },
      { name: 'Payload', val: 'PCM Audio 44.1kHz' },
      { name: 'Checksum', val: '0x4D5E' }
    ],
    eduTitle: 'RTP over UDP',
    eduBody: 'Real-Time Protocol (RTP) runs on top of UDP and adds timestamps and sequence numbers for media synchronization — but still no retransmission.'
  },
  {
    label: '⚠ LOST', meta: 'Packet\nDropped!', dir: 'forward',
    title: 'Packet Loss — No Retransmission!',
    desc: 'A UDP datagram is lost in transit (e.g., due to network congestion or corruption). Unlike TCP, UDP does NOT detect this loss and does NOT retransmit. The application may show a brief glitch.',
    recvState: 'LOSS!',
    fields: [
      { name: 'Source Port', val: '5500' },
      { name: 'Dest Port', val: '5004' },
      { name: 'Status', val: '❌ DROPPED' },
      { name: 'Retransmit?', val: 'NO — by design' }
    ],
    eduTitle: '🚫 No Error Recovery',
    eduBody: 'UDP has no mechanism to detect or recover from packet loss. For video, a dropped frame causes a brief visual artifact. TCP would stall and retransmit — causing worse latency for real-time media.'
  }
];

let udpCurrentStep = 0;
let udpPaused = true;
let udpTimer = null;

function renderUdpTimeline(idx) {
  const tl = $('udpTimeline');
  tl.className = 'step-timeline udp-tl';
  tl.innerHTML = UDP_STEPS.map((_, i) =>
    `<span class="${i <= idx ? 't-active' : ''}"></span>`
  ).join('');
}

function renderUdpStep(idx) {
  const s = UDP_STEPS[idx];
  $('udpStepBadge').textContent = `Step ${idx + 1}/${UDP_STEPS.length}`;
  $('udpInspTitle').textContent = s.title;
  $('udpInspDesc').textContent = s.desc;
  $('udpRecvState').textContent = s.recvState;
  $('udpRecvState').className = `node-state-badge udp-state${s.recvState === 'RECEIVED' ? '' : s.recvState === 'LOSS!' ? ' loss-state' : ''}`;

  if (s.recvState === 'LOSS!') {
    $('udpRecvState').style.background = '#fef2f2';
    $('udpRecvState').style.color = '#dc2626';
  } else {
    $('udpRecvState').style.background = '';
    $('udpRecvState').style.color = '';
  }

  // Animate UDP packet
  animateUdpPacket(s);
  renderUdpTimeline(idx);

  $('udpFieldGrid').innerHTML = s.fields.map(f =>
    `<div class="field-item"><div class="field-name">${esc(f.name)}</div><div class="field-val">${esc(f.val)}</div></div>`
  ).join('');
}

function animateUdpPacket(s) {
  const pkt = $('udpPacket');
  const isLost = s.label.includes('LOST');
  pkt.className = `fly-packet udp-pkt${isLost ? ' pkt-fin' : ''}`;
  $('udpPktLabel').textContent = isLost ? '⚠️ LOST' : s.label;
  $('udpPktMeta').textContent = s.meta;
  pkt.classList.remove('hidden');
  pkt.style.left = '5%';
  pkt.style.top = '50%';
  pkt.style.opacity = '1';

  requestAnimationFrame(() => {
    setTimeout(() => {
      if (isLost) {
        pkt.style.left = '50%';
        pkt.style.opacity = '0';
      } else {
        pkt.style.left = '95%';
      }
    }, 50);
  });
}

// Initialize UDP with first step
renderUdpStep(0);

$('udpPrev').addEventListener('click', () => {
  if (udpCurrentStep > 0) { udpCurrentStep--; renderUdpStep(udpCurrentStep); }
});
$('udpNext').addEventListener('click', () => {
  if (udpCurrentStep < UDP_STEPS.length - 1) { udpCurrentStep++; renderUdpStep(udpCurrentStep); }
});
$('udpPlayPause').addEventListener('click', () => {
  udpPaused = !udpPaused;
  $('udpPlayPause').textContent = udpPaused ? '▶ Play' : '⏸ Pause';
  if (!udpPaused) {
    udpTimer = setInterval(() => {
      if (!udpPaused) {
        if (udpCurrentStep < UDP_STEPS.length - 1) {
          udpCurrentStep++;
          renderUdpStep(udpCurrentStep);
        } else { clearInterval(udpTimer); udpPaused = true; $('udpPlayPause').textContent = '▶ Play'; }
      }
    }, 2000);
  } else {
    clearInterval(udpTimer);
  }
});
$('udpReplay').addEventListener('click', () => {
  clearInterval(udpTimer);
  udpCurrentStep = 0;
  udpPaused = true;
  $('udpPlayPause').textContent = '▶ Play';
  renderUdpStep(0);
});

// UDP Continuous Stream
let streamRunning = false;
let streamTimer = null;
let streamSent = 0, streamDropped = 0;

$('udpStreamBtn').addEventListener('click', () => {
  streamRunning = !streamRunning;
  const btn = $('udpStreamBtn');
  const display = $('udpStreamDisplay');
  if (streamRunning) {
    btn.textContent = '⏹ Stop Stream';
    btn.classList.add('streaming');
    display.classList.remove('hidden');
    streamSent = 0; streamDropped = 0;
    $('udpStreamLog').innerHTML = '';
    streamTimer = setInterval(() => {
      const seq = ++streamSent;
      const isLoss = Math.random() < 0.12; // 12% loss
      if (isLoss) streamDropped++;
      const lossRate = ((streamDropped / streamSent) * 100).toFixed(1);

      const entry = document.createElement('div');
      entry.className = `stream-entry ${isLoss ? 'dropped' : ''}`;
      entry.textContent = isLoss
        ? `[${new Date().toLocaleTimeString()}] Datagram #${seq} ─ ⚠️ DROPPED (network congestion)`
        : `[${new Date().toLocaleTimeString()}] Datagram #${seq} ─ ✓ DELIVERED · ${Math.floor(Math.random()*800+600)}B`;
      $('udpStreamLog').appendChild(entry);
      $('udpStreamLog').scrollTop = $('udpStreamLog').scrollHeight;
      $('udpStreamStats').textContent = `Sent: ${streamSent} · Dropped: ${streamDropped} · Loss: ${lossRate}%`;
    }, 400);
  } else {
    clearInterval(streamTimer);
    btn.textContent = '▶ Start Datagram Stream';
    btn.classList.remove('streaming');
  }
});

// ─────────────────────────────────────────────────────
// BROWSING SCENARIO
// ─────────────────────────────────────────────────────
const BROWSE_STEPS = [
  {
    num: 1,
    title: 'User Types URL in Browser',
    desc: 'User enters "https://www.example.com" — browser parses the URL to extract protocol (HTTPS), hostname, and path.',
    layers: [{ cls: 'lt-app', label: 'L7: Application' }],
    pktLabel: 'URL',
    pktColor: '#2563eb'
  },
  {
    num: 2,
    title: 'DNS Lookup: Hostname → IP Address',
    desc: 'Browser queries local DNS resolver. DNS resolves "www.example.com" → 93.184.216.34 via recursive resolution.',
    layers: [{ cls: 'lt-dns', label: 'DNS: Port 53' }, { cls: 'lt-app', label: 'L7' }],
    pktLabel: 'DNS',
    pktColor: '#7c3aed'
  },
  {
    num: 3,
    title: 'TCP 3-Way Handshake (SYN → SYN-ACK → ACK)',
    desc: 'Browser establishes a reliable TCP connection to 93.184.216.34:443. This ensures ordered, reliable delivery of HTTP data.',
    layers: [{ cls: 'lt-tcp', label: 'L4: TCP' }, { cls: 'lt-ip', label: 'L3: IP' }],
    pktLabel: 'SYN',
    pktColor: '#059669'
  },
  {
    num: 4,
    title: 'HTTP GET Request Sent',
    desc: 'Browser sends "GET / HTTP/1.1" with headers (Host, Accept, User-Agent, etc.) over the established TCP connection.',
    layers: [{ cls: 'lt-app', label: 'L7: HTTP' }, { cls: 'lt-tcp', label: 'L4: TCP' }, { cls: 'lt-ip', label: 'L3: IP' }],
    pktLabel: 'HTTP',
    pktColor: '#2563eb'
  },
  {
    num: 5,
    title: 'Web Server Processes Request',
    desc: 'Web server (nginx/Apache) receives the HTTP request, retrieves the HTML file, and prepares the response with status 200 OK.',
    layers: [{ cls: 'lt-app', label: 'L7: Server' }],
    pktLabel: '200',
    pktColor: '#059669'
  },
  {
    num: 6,
    title: 'HTTP 200 OK Response + HTML',
    desc: 'Server sends HTTP 200 OK with HTML content. TCP guarantees all data arrives intact and in order. Browser renders the webpage.',
    layers: [{ cls: 'lt-app', label: 'L7: HTTP' }, { cls: 'lt-tcp', label: 'L4: TCP' }, { cls: 'lt-ip', label: 'L3: IP' }],
    pktLabel: 'HTML',
    pktColor: '#0891b2'
  },
  {
    num: 7,
    title: 'Connection Close (TCP FIN)',
    desc: 'After data transfer, browser/server close the TCP connection gracefully using the 4-way FIN handshake. Webpage is fully loaded!',
    layers: [{ cls: 'lt-tcp', label: 'L4: TCP FIN' }, { cls: 'lt-ip', label: 'L3: IP' }],
    pktLabel: 'FIN',
    pktColor: '#dc2626'
  }
];

const STREAM_STEPS = [
  {
    num: 1,
    title: 'User Opens Streaming App (e.g., YouTube)',
    desc: 'User clicks play on a 720p video. The streaming app fetches the video manifest (playlist file) listing all available quality levels.',
    layers: [{ cls: 'lt-app', label: 'L7: Application' }],
    pktLabel: 'PLAY',
    pktColor: '#d97706'
  },
  {
    num: 2,
    title: 'HTTP Request for Video Manifest',
    desc: 'Streaming app sends HTTP GET for the manifest file (DASH .mpd or HLS .m3u8) describing video chunks and quality levels.',
    layers: [{ cls: 'lt-app', label: 'HLS/DASH' }, { cls: 'lt-tcp', label: 'L4: TCP' }],
    pktLabel: 'Manifest',
    pktColor: '#2563eb'
  },
  {
    num: 3,
    title: 'DNS + TCP to CDN (Content Delivery Network)',
    desc: 'DNS resolves CDN hostname. TCP/UDP connection established to nearest CDN edge server for low latency. CDN reduces distance to data.',
    layers: [{ cls: 'lt-dns', label: 'DNS' }, { cls: 'lt-tcp', label: 'TCP / UDP' }, { cls: 'lt-ip', label: 'L3: IP' }],
    pktLabel: 'CDN',
    pktColor: '#059669'
  },
  {
    num: 4,
    title: 'UDP/RTP Streaming of Video Chunks',
    desc: 'Video segments (2-10 seconds each) are streamed via UDP datagrams. RTP adds timestamps. Low latency prioritized over reliability.',
    layers: [{ cls: 'lt-udp', label: 'L4: UDP/RTP' }, { cls: 'lt-ip', label: 'L3: IP' }],
    pktLabel: 'UDP',
    pktColor: '#d97706'
  },
  {
    num: 5,
    title: 'Continuous Media Datagrams Flow',
    desc: 'Video and audio datagrams flow continuously. Some may be dropped but not retransmitted — minor artifacts preferred over buffering.',
    layers: [{ cls: 'lt-udp', label: 'UDP Datagrams' }],
    pktLabel: '🎬',
    pktColor: '#d97706'
  },
  {
    num: 6,
    title: 'Adaptive Bitrate (ABR) Adjustment',
    desc: 'If network degrades, app switches to lower quality (480p → 360p). If bandwidth improves, switches up. All managed over TCP/UDP.',
    layers: [{ cls: 'lt-app', label: 'ABR Logic' }, { cls: 'lt-tcp', label: 'Quality Switch' }],
    pktLabel: 'ABR',
    pktColor: '#7c3aed'
  }
];

function buildScenarioSteps(steps, containerId) {
  const container = $(containerId);
  container.innerHTML = '';
  steps.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'scen-step';
    div.id = `${containerId}-step-${i}`;
    div.innerHTML = `
      <div class="step-num">${s.num}</div>
      <div class="step-info">
        <strong>${esc(s.title)}</strong>
        <p>${esc(s.desc)}</p>
        <div class="step-layers">
          ${s.layers.map(l => `<span class="step-layer-tag ${l.cls}">${esc(l.label)}</span>`).join('')}
        </div>
      </div>`;
    container.appendChild(div);
  });
}

buildScenarioSteps(BROWSE_STEPS, 'browseSteps');
buildScenarioSteps(STREAM_STEPS, 'streamSteps');

function runScenarioAnimation(steps, containerId, packetEl, packetLabelEl) {
  const allSteps = document.querySelectorAll(`#${containerId} .scen-step`);
  allSteps.forEach(s => { s.className = 'scen-step'; });

  packetEl.classList.remove('hidden');
  let idx = 0;

  function doStep() {
    if (idx > 0) {
      allSteps[idx - 1].className = 'scen-step step-done';
    }
    if (idx < steps.length) {
      allSteps[idx].className = 'scen-step step-active';
      allSteps[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      if (packetLabelEl) packetLabelEl.textContent = steps[idx].pktLabel;
      if (packetEl.querySelector('.scen-pkt-label')) {
        packetEl.querySelector('.scen-pkt-label').style.background = steps[idx].pktColor || '#2563eb';
      }

      idx++;
      setTimeout(doStep, 1600);
    } else {
      allSteps.forEach(s => s.classList.add('step-done'));
    }
  }

  doStep();
}

$('runBrowse').addEventListener('click', () => {
  buildScenarioSteps(BROWSE_STEPS, 'browseSteps');
  runScenarioAnimation(BROWSE_STEPS, 'browseSteps', $('browsePacket'), $('browsePacketLabel'));
});

$('runStream').addEventListener('click', () => {
  buildScenarioSteps(STREAM_STEPS, 'streamSteps');
  runScenarioAnimation(STREAM_STEPS, 'streamSteps', $('streamPacket'), $('streamPacketLabel'));
});

// Auto-build on load
buildScenarioSteps(BROWSE_STEPS, 'browseSteps');
buildScenarioSteps(STREAM_STEPS, 'streamSteps');

// ─────────────────────────────────────────────────────
// Add CSS animation for fadeUp in JS context
// ─────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .loss-state { background: #fef2f2!important; color: #dc2626!important; }
`;
document.head.appendChild(style);

console.log('✅ Application & Transport Layer Protocol Visualizer initialized.');
