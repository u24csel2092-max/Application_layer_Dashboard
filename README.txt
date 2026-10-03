# Network Protocol Visualizer (Application & Transport Layers)

## Run
This project is a pure HTML/CSS/JavaScript simulation and does not require Flask, npm, or an internet connection.

1. Open the project folder in VS Code.
2. Open a terminal in that folder.
3. Run:
   `python -m http.server 8000`
4. Open Chrome and visit:
   `http://localhost:8000`

## Features

### 1. Application Layer Protocol Visualizer (Layer 7)
- Dual-panel interface with Activity Panel and Protocol Visualization Panel.
- **Browsing**: DNS query/response + HTTP request/response.
- **Mail**: SMTP EHLO, MAIL FROM, RCPT TO, DATA, and QUIT.
- **Streaming**: DNS + HTTP manifest/playlist + media segment requests.
- Direction, sequence/timing, key fields, progressive visualization.
- Previous, Next, Pause/Resume, and Replay controls.
- Real-time Activity Log.

### 2. Transport Layer Protocol Visualizer (Layer 4)
- **Protocols Supported**: TCP (Transmission Control Protocol) and UDP (User Datagram Protocol).
- **Protocol Selection**: Dedicated TCP and UDP selection tabs.
- **Three Scenarios**:
  1. **Browsing (TCP)**:
     - Client → SYN → Server
     - Server → SYN-ACK → Client
     - Client → ACK → Server (Connection ESTABLISHED)
     - Reliable Data Transfer (HTTP GET request) and ACKs
     - Server HTTP 200 response segment and final Client ACK
  2. **Streaming (UDP)**:
     - Continuous datagram stream from Client → Server without TCP handshake
     - Zero connection setup delay (0ms)
     - Interactive Continuous Datagram Stream emitter with real-time packet counter
     - Best-effort delivery model (low latency, tolerates dropped frames)
  3. **Mail (TCP)**:
     - Explicit TCP 3-Way Handshake (SYN → SYN-ACK → ACK) on Port 25
     - Server 220 Greeting banner segment
     - Reliable client EHLO, MAIL FROM, RCPT TO, DATA commands with server ACKs
     - Final delivery confirmation (250 Queued) ACK
- **Interactive Animated Wire Stage**:
  - Animated packets traversing bidirectional wire channels (Forward & Reverse)
  - Color-coded packet badges: SYN (blue), SYN-ACK (green), ACK (indigo), DATA (purple), UDP (amber)
  - Visual pulse indicators on Client and Server host nodes upon segment receipt
  - Controls: Previous, Next, Pause/Resume, Replay, and 1x/2x Speed toggles
- **Technical Information & Metrics**:
  - Protocol, well-known & ephemeral ports, connection-oriented vs connectionless states
  - Reliability & delivery guarantees (ACKs, ARQ retransmissions vs best effort)
  - Header overhead breakdown (20–60 bytes TCP vs 8 bytes UDP)
- **Wireshark-Style Header Inspector**:
  - Interactive Layer 4 header field breakdown (Source/Dest ports, Sequence/Ack numbers, Flags: URG, ACK, PSH, RST, SYN, FIN, Window Size, Checksum, and Payload)
- **Educational Callouts & TCP vs UDP Comparison Matrix**:
  - In-depth comparison table between RFC 793 (TCP) and RFC 768 (UDP) with active scenario relevance
  - Clear explanations designed for college computer networking laboratory assignments

### 3. Transmission & Physical Layer Visualizer (Layer 1 & 2)
- **Physical Transmission Media Simulation**:
  - **Fiber Optic Cable**: Modulated laser light pulses, $s = 200,000\text{ km/s}$ ($c / 1.48$), $10\text{ Gbps}$ bandwidth, complete immunity to EMI.
  - **Copper Twisted Pair (Cat6)**: Differential electrical voltage ($\pm 2.5\text{V}$), $s = 200,000\text{ km/s}$, $1\text{ Gbps}$ bandwidth.
  - **Wireless Radio (Wi-Fi 6 / 5GHz)**: RF sine wave modulation (OFDM), $s = 300,000\text{ km/s}$ ($c$ in air), $1.2\text{ Gbps}$ bandwidth.
- **Line Coding / Signal Modulation Schemes**:
  - **NRZ-L (Non-Return to Zero Level)**: High positive voltage ($+5\text{V}$) for bit 1, low voltage ($0\text{V}$) for bit 0.
  - **Manchester Encoding (IEEE 802.3)**: Low-to-High transition for bit 1, High-to-Low transition for bit 0; self-clocking synchronization.
  - **Bipolar AMI**: $0\text{V}$ for bit 0, alternating positive/negative pulses for bit 1 to prevent DC baseline wander.
- **Real-Time Oscilloscope Waveform Canvas**:
  - HTML5 Canvas rendering animated continuous waveforms scrolling across the transmission medium.
  - Interactive bit train cells displaying bit serialization from upper layer segments (SYN, HTTP GET, RTP Video, DNS).
- **Interactive Delay Calculator ($d_{trans}$ vs $d_{prop}$)**:
  - Interactive sliders for Packet Size ($L$: 64B–1500B), Bandwidth ($R$: 10Mbps–10Gbps), and Distance ($d$: 1km–10,000km).
  - Calculates $d_{trans} = L / R$ and $d_{prop} = d / s$ with a visual percentage split bar and educational insight notes.
- **Bit Error Injection & CRC-32 Validation**:
  - Simulated electromagnetic noise injection flips random bits in transit.
  - Receiver checks the 32-bit Frame Check Sequence (FCS); detects bit corruption and rejects frame.

## Note
Protocol behavior is simulated for educational visualization. No real DNS, SMTP, video, or raw socket traffic is generated.


