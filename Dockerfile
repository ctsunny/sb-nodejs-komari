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
      if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
        sed -i 's|http://deb.debian.org/debian|http://archive.debian.org/debian|g; s|http://deb.debian.org/debian-security|http://archive.debian.org/debian-security|g' /etc/apt/sources.list.d/debian.sources; \
      fi; \
      if [ -f /etc/apt/sources.list ]; then \
        sed -i 's|http://deb.debian.org/debian|http://archive.debian.org/debian|g; s|http://deb.debian.org/debian-security|http://archive.debian.org/debian-security|g' /etc/apt/sources.list; \
        sed -i '/-updates/d' /etc/apt/sources.list; \
      fi; \
      printf 'Acquire::Check-Valid-Until "false";\n' > /etc/apt/apt.conf.d/99debian-archive-no-check-valid; \
    }; \
    retry_apt_update || { switch_to_archive_mirror; retry_apt_update; }; \
    apt-get install -y --no-install-recommends bash curl ca-certificates openssl; \
    rm -rf /var/lib/apt/lists/*

COPY package.json index.js start.sh ./

RUN chmod +x start.sh

EXPOSE 8000

CMD ["npm", "start"]
