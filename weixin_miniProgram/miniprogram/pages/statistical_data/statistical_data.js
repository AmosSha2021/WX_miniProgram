Page({
  data: {
    groupRankings: [], // 按组排名数据
    totalRankings: [] // 总排行榜数据
  },

  onLoad() {
    this.fetchStatistics();
  },

  async fetchStatistics() {
    const db = wx.cloud.database();
    const $ = db.command.aggregate; // 新增聚合操作符引用

    // 按组统计前10名
    // 修改分组统计的字段映射
    const groupRes = await db.collection('checkpoints').aggregate()
      .group({
        _id: {
          group: '$groupID',      // 保持原字段
          employeeID: '$employeeID', 
          name: '$employeeName'  // 修正为实际字段
        },
        totalTime: $.sum('$timeCost')
      })
      .sort({
        '_id.group': 1,
        totalTime: 1
      })
      .end();

    // 修改总排行榜统计字段
    // 处理分组数据（修复变量名）
    // 修改分组数据处理
    const groupData = groupRes.list.reduce((acc, cur) => {
      const group = cur._id.group;
      if (!acc[group]) acc[group] = [];
      if (acc[group].length < 10) {
        acc[group].push({
          group,
          employeeID: cur._id.employeeID,
          name: cur._id.name,
          totalTime: this.formatDuration(cur.totalTime) // 修改这里
        });
      }
      return acc;
    }, {});

    // 必须补回总排行榜查询（之前被误删）
    const totalRes = await db.collection('checkpoints').aggregate()
      .group({
        _id: {
          employeeID: '$employeeID',
          group: '$groupID',
          name: '$employeeName'
        },
        totalTime: $.sum('$timeCost')
      })
      .sort({ totalTime: 1 })
      .limit(10)
      .end();

    // 设置数据
    this.setData({
      groupRankings: Object.entries(groupData).map(([group, members]) => ({
        group,
        members
      })),
      totalRankings: totalRes.list.map(item => ({
        group: item._id.group,
        employeeID: item._id.employeeID,
        name: item._id.name,
        totalTime: this.formatDuration(item.totalTime) // 修改这里
      }))
    });
  },
  // 新增/修改时间格式化方法
  // 修改后的时间格式化方法
  formatDuration(seconds) {
      if (!seconds || isNaN(seconds)) return '--';
      const totalSeconds = Math.floor(seconds); // 取整总秒数
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      return `${mins}分${secs}秒`;  // 移除小数显示
  },
});