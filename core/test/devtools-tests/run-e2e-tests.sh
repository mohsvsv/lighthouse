#!/usr/bin/env bash

##
# @license
# Copyright 2022 Google LLC
# SPDX-License-Identifier: Apache-2.0
##

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BUILD_FOLDER="${BUILD_FOLDER:-LighthouseIntegration}"
export LH_ROOT="$SCRIPT_DIR/../../.."

cd "$DEVTOOLS_PATH"

TEST_PATTERN="${1:-test/e2e/lighthouse/*}"
npm run test -- "$TEST_PATTERN" --t $BUILD_FOLDER
