# Mind Tauri Desktop App

A desktop application for the Mind knowledge management app, built with Tauri.

## Features

- Native desktop experience for Mind
- No CORS restrictions - connects directly to Ollama on localhost:11434
- Cross-platform support (macOS, Windows, Linux)
- Window size: 1200x800 (min: 800x600)

## Prerequisites

- [Rust](https://rustup.rs/) (1.70 or later)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

## Setup

```bash
# Install Tauri CLI if not already installed
cargo install tauri-cli

# Navigate to project directory
cd /Users/peteroberts/Documents/Kai/KnowledgeBase/mind-tauri

# Run in development mode
cargo tauri dev

# Build for production
cargo tauri build
```

## Ollama Integration

The app is configured to allow connections to Ollama on `http://localhost:11434` without CORS restrictions.

Make sure Ollama is running locally before using AI features in the app.

## Project Structure

```
mind-tauri/
├── Cargo.toml          # Rust dependencies
├── tauri.conf.json     # Tauri configuration
├── build.rs            # Build script
├── index.html          # Main frontend (copied from mind-demo)
├── src/
│   └── main.rs         # Rust entry point
└── icons/              # App icons
    ├── 32x32.png
    ├── 128x128.png
    ├── 128x128@2x.png
    ├── icon.icns       # macOS icon
    └── icon.ico        # Windows icon
```

## Build Targets

- **macOS**: `.dmg` and `.app` bundle
- **Windows**: `.msi` installer and `.exe`
- **Linux**: `.deb` package and AppImage

## Notes

- The CSP (Content Security Policy) is configured to allow connections to `localhost:11434` for Ollama API access
- External scripts from `unpkg.com` are allowed for Phosphor Icons
