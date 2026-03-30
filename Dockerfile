FROM node:20-bookworm-slim

WORKDIR /app

RUN set -eux; \
    retry_apt_update() { \
      attempt=1; \
      while [ "$attempt" -le 3 ]; do \
        if apt-get update; then \
          return 0; \
        fi; \
        echo "apt-get update failed, retry ${attempt}/3" >&2; \
        sleep $((attempt * 2)); \
        attempt=$((attempt + 1)); \
      done; \
      return 1; \
    }; \
    switch_to_archive_mirror() { \
      codename="$(. /etc/os-release && printf '%s' "$VERSION_CODENAME")"; \
      if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
        printf 'Types: deb\nURIs: http://archive.debian.org/debian\nSuites: %s\nComponents: main\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg\n' "$codename" > /etc/apt/sources.list.d/debian.sources; \
      fi; \
      if [ -f /etc/apt/sources.list ]; then \
        printf 'deb http://archive.debian.org/debian %s main\n' "$codename" > /etc/apt/sources.list; \
      fi; \
      printf 'Acquire::Check-Valid-Until "false";\n' > /etc/apt/apt.conf.d/99debian-archive-no-check-valid; \
    }; \
    retry_apt_update || { switch_to_archive_mirror; retry_apt_update; }; \
    apt-get install -y --no-install-recommends bash curl ca-certificates openssl; \
    rm -rf /var/lib/apt/lists/*

COPY index.js start.sh ./

RUN chmod +x start.sh

EXPOSE 8000

CMD ["node", "index.js"]
