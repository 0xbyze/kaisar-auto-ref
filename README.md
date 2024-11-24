# Kaisar Network Auto Ref

Automatic referral script for Kaisar using captcha solver and proxies.

## Installation

Make sure you have nodejs installed.

```bash
npm install
```

## Proxy format

Below is the format proxy

```bash
http://user:pass@host:port
```

## Usage
The email provider is currently tempmail.lol, other provider still under development.
`Api_key` for email provider is optional, it can be blank if don't have any api. 

1. Make file `proxy.txt` with format above.

2. Run auto ref, 
```bash
npm start
```

3. Split token.
```bash
npm run split
```