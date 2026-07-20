#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)";
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)";
OUTPUT_DIR="$(cd -- "${REPO_ROOT}/.." && pwd)";
VERSION_FILE="${REPO_ROOT}/version.dat";

if [[ ! -f "${VERSION_FILE}" ]]; then
	    echo "ERROR: version.dat was not found at:";
	        echo "  ${VERSION_FILE}";
		    exit 1;
fi;

VERSION="$(tr -d '[:space:]' < "${VERSION_FILE}")";

if [[ -z "${VERSION}" ]]; then
	    echo "ERROR: version.dat is empty.";
	        exit 1;
fi;

if [[ ! "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][A-Za-z0-9.-]+)?$ ]]; then
	    echo "ERROR: Invalid version in version.dat: ${VERSION}";
	        echo "Expected a version such as 1.0.0";
		    exit 1;
fi;

TIMESTAMP="$(date +'%Y-%m-%d_%H%M%S')";
ARCHIVE_NAME="AirlineEmpire_v${VERSION}_${TIMESTAMP}.tar.gz";
FINAL_ARCHIVE="${OUTPUT_DIR}/${ARCHIVE_NAME}";

echo "Packaging Airline Empire...";
echo "Repository: ${REPO_ROOT}";
echo "Version:    ${VERSION}";
echo "Archive:    ${FINAL_ARCHIVE}";
echo;

tar \
	    --exclude='.git' \
	        --exclude='node_modules' \
		    --exclude='patch_backups' \
		        -czf "${FINAL_ARCHIVE}" \
			    -C "${REPO_ROOT}" \
			        .;

echo;
echo "SUCCESS";
echo "Created:";
echo "  ${FINAL_ARCHIVE}";
