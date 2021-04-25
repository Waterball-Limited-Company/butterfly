const dagreLayout = require("./dagreLayout");

// STEP1: 找出单独节点&group节点， 单独布局
// STEP2: group内的节点单独布局
function dagreCompound (params) {
  console.log('params: ', params);
  // 拿到坐标， 重组data
  const initData = params.data;

  if (_.isEmpty(initData.groups)) {
    dagreLayout(params);
    return;
  }

  // group存在的情况
  // new groups
  // step1: 找出单独节点&group节点， 单独布局
  const {data} = params;
  const aloneNodes = data.nodes.filter(v => !v.group);

  // 获取group和单节点之间的连线关系
  const groupAloneNodesEdges = getGroupAndAloneNodesEdges(data);
  console.log('groupAloneNodesEdges: ', groupAloneNodesEdges);

  const groupData = {
    ...params,
    ranksep: 60,
    nodesep: 90,
    data: {
      nodes: [...aloneNodes, ...data.groups],
      edges: groupAloneNodesEdges
    }
  };

  // 拿到group节点坐标
  dagreLayout(groupData);
  console.log('groupData: ', groupData);
  // group坐标赋值
  (params.data.groups || []).forEach(initGroup => {
    const item = groupData.data.nodes.find(n => n.id === initGroup.id);

    if (!item) {
      return;
    }

    initGroup.top = item.top;
    initGroup.left = item.left;
  });

  // 修改单节点的坐标
  aloneNodes.forEach(node => {
    const item = groupData.data.nodes.find(n => n.id === node.id);
    const nodeIndex = params.data.nodes.findIndex(f => f.id === node.id);

    if (nodeIndex === -1) {
      return;
    }

    params.data.nodes[nodeIndex].top = item.top;
    params.data.nodes[nodeIndex].left = item.left;

  });

  // group内节点的坐标
  (params.data.groups || []).forEach((group, idx) => {
    const inGroupNodes = data.nodes.filter(v => v.group === group.id);
    const nodeEdges = getInGroupNodesEdges(group.id);
    console.log('nodeEdges: ', nodeEdges);
    const inGroupDatas = {
      ...params,
      nodesep: 28,
      data: {
        nodes: inGroupNodes,
        edges: nodeEdges
      }
    };
    dagreLayout(inGroupDatas);
    console.log('inGroupDatas: ', idx, inGroupDatas);
    inGroupDatas.data.nodes.forEach(node => {
      const nodeIndex = params.data.nodes.findIndex(f => f.id === node.id);

      if (nodeIndex === -1) {
        return;
      }

      params.data.nodes[nodeIndex].top = node.top;
      params.data.nodes[nodeIndex].left = node.left;
    });
  });
}
/**
 * 获取group以及单节点之间的连线关系
 * @param {Object} data 
 * @param {Array} data.nodes
 * @param {Array} data.edges
 * @param {Array} data.groups
 * @returns [{source: "group1", target: "node-id"}, {source: "node-id", target: "group2"}]
 */
const getGroupAndAloneNodesEdges = (data) => {
  const {nodes = [], edges = [], groups = []} = data;
  const groupAloneNodesEdges = [];

  // groups与单节点之间的关系
  groups.forEach(g => {
    const groupItemNodes = nodes.filter(n => n.group === g.id);
    groupItemNodes.forEach(iNode => {
      const sourceEdges = edges.filter(e => String(e.source) === String(iNode.id));
      const targetEdges = edges.filter(e => String(e.target) === String(iNode.id));

      sourceEdges.forEach(s => s.source = g.id);
      targetEdges.forEach(t => t.target = g.id);

      groupAloneNodesEdges.push(...sourceEdges, ...targetEdges);
    })
  });

  // 单节点之间的连线关系
  const aloneNodes = nodes.filter(v => !v.group);

  aloneNodes.forEach(aNode => {
    const sourceEdges = edges.filter(e => String(e.source) === String(aNode.id));
    const targetEdges = edges.filter(e => String(e.target) === String(aNode.id));

    groupAloneNodesEdges.push(...sourceEdges, ...targetEdges);
  })

  return _.uniqWith(groupAloneNodesEdges, _.isEqual);
};
/**
 * 获取group内节点的连线关系
 * @param {Object} data 
 * @param {Array} data.nodes
 * @param {Array} data.edges
 * @param {Number | String} groupId
 */
const getInGroupNodesEdges = (data, groupId) => {
  const {nodes = [], edges = []} = data;

  const nodeEdges = [];
  const inGroupNodes = nodes.filter(n => n.group === groupId);

  inGroupNodes.forEach(igNode => {
    const sourceEdges = edges.filter(e => String(e.source) === String(igNode.id));
    const targetEdges = edges.filter(e => String(e.target) === String(igNode.id));

    nodeEdges.push(...sourceEdges, ...targetEdges);
  })

  return _.uniqWith(nodeEdges, _.isEqual);
}

module.exports = dagreCompound;
