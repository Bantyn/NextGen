# MediKiosk — API Documentation & Specification

> **Document Status**: Official API Specification  
> **Server Engine**: Node.js + Express  
> **Base URL Format**: `http://<SERVER_HOST>:<PORT>/api/v1`  
> **Default Local Base URL**: `http://localhost:5000/api/v1`  
> **Network Base URL**: `http://<YOUR_LOCAL_IP>:5000/api/v1`

---

## 1. 🌐 System Overview & Base URLs

All API endpoints are prefixed with `/api/v1`. The server is configured with CORS enabled (`CORS_ORIGIN=*`) and binds to `0.0.0.0` to allow cross-network calls from client kiosks, tablets, and web apps.

| Environment               | Base URL                         |
| :------------------------ | :------------------------------- |
| **Local Environment**     | `http://localhost:5000/api/v1`   |
| **Network (OPD / Kiosk)** | `http://<SERVER_IP>:5000/api/v1` |

---
