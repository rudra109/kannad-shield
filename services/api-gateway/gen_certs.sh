#!/bin/bash
# =============================================================
#  Kanad S.H.I.E.L.D. — Generate self-signed TLS cert for demo
#  Run once: bash services/api-gateway/gen_certs.sh
# =============================================================
mkdir -p services/api-gateway/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout services/api-gateway/certs/demo.key \
  -out    services/api-gateway/certs/demo.crt \
  -subj   "/C=IN/ST=Gujarat/L=Ahmedabad/O=KanadShield/CN=localhost"
echo "Self-signed cert generated at services/api-gateway/certs/"
echo "Replace with Let's Encrypt certs in production."
