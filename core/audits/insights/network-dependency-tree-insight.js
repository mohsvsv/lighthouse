/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {UIStrings} from '@paulirish/trace_engine/models/trace/insights/NetworkDependencyTree.js';

import {Audit} from '../audit.js';
import * as i18n from '../../lib/i18n/i18n.js';
import {adaptInsightToAuditProduct} from './insight-audit.js';

// eslint-disable-next-line max-len
const str_ = i18n.createIcuMessageFn('node_modules/@paulirish/trace_engine/models/trace/insights/NetworkDependencyTree.js', UIStrings);

class NetworkDependencyTreeInsight extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'network-dependency-tree-insight',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.title),
      description: str_(UIStrings.description),
      guidanceLevel: 1,
      requiredArtifacts: ['traces', 'SourceMaps'],
      replacesAudits: ['critical-request-chains'],
    };
  }

  /**
   * @param {import('@paulirish/trace_engine').Insights.Models.NetworkDependencyTree.CriticalRequestNode[]} nodes
   * @return {LH.Audit.Details.SimpleCriticalRequestNode}
   */
  static nodesToSimpleCriticalRequestNode(nodes) {
    /** @type {LH.Audit.Details.SimpleCriticalRequestNode} */
    const simpleRequestNode = {};

    for (const node of nodes) {
      const {request} = node;

      const timing = request.args.data.timing;
      const requestTime = timing?.requestTime ?? 0;

      simpleRequestNode[request.args.data.requestId] = {
        request: {
          url: request.args.data.url,
          transferSize: request.args.data.encodedDataLength,
          startTime: requestTime,
          responseReceivedTime: requestTime + (timing?.receiveHeadersEnd ?? 0) / 1000,
          endTime: (request.args.data.syntheticData.finishTime) / 1_000_000,
        },
        children: this.nodesToSimpleCriticalRequestNode(node.children),
      };
    }

    return simpleRequestNode;
  }

  /**
   * @param {import('@paulirish/trace_engine').Insights.Models.NetworkDependencyTree.CriticalRequestNode[]} rootNodes
   * @param {number} maxTime
   * @return {LH.Audit.Details.CriticalRequestChain}
   */
  static createRequestChainDetails(rootNodes, maxTime) {
    const chains = this.nodesToSimpleCriticalRequestNode(rootNodes);

    return {
      type: 'criticalrequestchain',
      chains,
      longestChain: {
        duration: maxTime / 1000,
      },
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @param {LH.Audit.Context} context
   * @return {Promise<LH.Audit.Product>}
   */
  static async audit(artifacts, context) {
    return adaptInsightToAuditProduct(artifacts, context, 'NetworkDependencyTree', (insight) => {
      return this.createRequestChainDetails(insight.rootNodes, insight.maxTime);
    });
  }
}

export default NetworkDependencyTreeInsight;
