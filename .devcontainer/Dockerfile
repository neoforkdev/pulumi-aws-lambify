FROM mcr.microsoft.com/devcontainers/python:dev-3.13-bullseye

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ENV DEBIAN_FRONTEND=noninteractive

# Base dev tools
RUN set -ex; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      curl \
      git \
      wget \
      jq \
      unzip \
      gnupg \
      shellcheck \
      lsb-release; \
    rm -rf /var/lib/apt/lists/*

# Node.js repo setup
RUN curl -fsSL https://deb.nodesource.com/setup_23.x | bash -

# HashiCorp repo setup
RUN curl -fsSL https://apt.releases.hashicorp.com/gpg \
    | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" \
    > /etc/apt/sources.list.d/hashicorp.list

# Install Node.js & Terraform
RUN set -ex; \
    apt-get update; \
    apt-get install -y --no-install-recommends nodejs terraform; \
    rm -rf /var/lib/apt/lists/*

# AWS CLI v2
RUN set -ex; \
    curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"; \
    unzip awscliv2.zip; \
    ./aws/install; \
    rm -rf aws awscliv2.zip

# yq (mikefarah)
RUN curl -fsSL "https://github.com/mikefarah/yq/releases/download/v4.45.1/yq_linux_amd64" -o /usr/local/bin/yq && \
    chmod +x /usr/local/bin/yq

# hadolint
RUN curl -fsSL -o /usr/local/bin/hadolint "https://github.com/hadolint/hadolint/releases/latest/download/hadolint-Linux-x86_64" && \
    chmod +x /usr/local/bin/hadolint

# terragrunt (use amd64, like a grownup)
RUN curl -fsSL "https://github.com/gruntwork-io/terragrunt/releases/download/v0.80.2/terragrunt_linux_amd64" -o /usr/local/bin/terragrunt && \
    chmod +x /usr/local/bin/terragrunt

# tfsec
RUN curl -fsSL https://raw.githubusercontent.com/aquasecurity/tfsec/master/scripts/install_linux.sh | bash

# pre-commit and build (Python tools)
RUN pip install --no-cache-dir pre-commit==4.1.0 build==1.2.2

# tflint
RUN curl -fsSL https://raw.githubusercontent.com/terraform-linters/tflint/master/install_linux.sh | bash

# Pulumi
RUN curl -fsSL https://get.pulumi.com | sudo sh -s -- --install-root /usr/local

# Go
RUN set -ex; \
    curl -fsSL https://go.dev/dl/go1.24.0.linux-amd64.tar.gz -o go.tar.gz; \
    tar -C /usr/local -xzf go.tar.gz; \
    echo "export PATH=\$PATH:/usr/local/go/bin" >> /etc/profile; \
    rm go.tar.gz
# saml2aws
RUN set -ex; \
    CURRENT_VERSION=$(curl -Ls https://api.github.com/repos/Versent/saml2aws/releases/latest | grep 'tag_name' | cut -d'v' -f2 | cut -d'"' -f1); \
    curl -fsSL "https://github.com/Versent/saml2aws/releases/download/v${CURRENT_VERSION}/saml2aws_${CURRENT_VERSION}_linux_amd64.tar.gz" -o saml2aws.tar.gz; \
    tar -xzf saml2aws.tar.gz -C /usr/local/bin; \
    rm saml2aws.tar.gz; \
    chmod +x /usr/local/bin/saml2aws;

# Devcontainer hook scripts
COPY post-start post-create /usr/local/bin/
RUN chmod 0777 /usr/local/bin/post-start /usr/local/bin/post-create

EXPOSE 5173
