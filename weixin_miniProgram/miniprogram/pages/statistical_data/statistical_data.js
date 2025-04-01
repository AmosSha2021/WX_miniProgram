Page({
  data: {
    groupRankings: [], 
    totalRankings: [] 
  },

  onLoad() {
    console.log('[DEBUG] 开始加载统计页面');
    this.fetchStatistics();
  },

  async fetchStatistics() {
    try {
      const db = wx.cloud.database();
      const $ = db.command.aggregate;

      // 分组数据查询
      console.log('[DEBUG] 开始请求分组数据...');
      const groupRes = await db.collection('checkpoints').aggregate()
        .group({
          _id: {
            group: '$groupID',
            employeeID: '$employeeID',
            name: '$employeeName'
          },
          totalTime: $.sum('$timeCost')
        })
        .sort({ '_id.group': 1, totalTime: 1 })
        .end();
      console.log('[DEBUG] 分组查询结果:', {
        code: groupRes.errMsg,
        count: groupRes.list.length,
        sample: groupRes.list[0] || '无数据'
      });

      // 分组数据处理
      const groupData = groupRes.list.reduce((acc, cur) => {
        const group = cur._id.group;
        console.log(`[DEBUG] 处理员工数据：${cur._id.name} (组:${group})`);
        
        if (!acc[group]) {
          console.log(`[DEBUG] 创建新组：${group}`);
          acc[group] = [];
        }
        
        if (acc[group].length < 10) {
          acc[group].push({
            group,
            employeeID: cur._id.employeeID,
            name: cur._id.name,
            totalTime: this.formatDuration(cur.totalTime)
          });
        } else {
          console.warn(`[WARN] 组 ${group} 已超过10条记录`);
        }
        return acc;
      }, {});
      console.log('[DEBUG] 分组处理完成:', Object.keys(groupData));

      // 总榜数据查询
      console.log('[DEBUG] 开始请求总榜数据...');
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
      console.log('[DEBUG] 总榜查询结果:', {
        code: totalRes.errMsg,
        count: totalRes.list.length,
        sample: totalRes.list[0] || '无数据'
      });

      // 数据更新
      const finalData = {
        groupRankings: Object.entries(groupData).map(([group, members]) => ({
          group,
          members
        })),
        totalRankings: totalRes.list.map(item => ({
          group: item._id.group,
          employeeID: item._id.employeeID,
          name: item._id.name,
          totalTime: this.formatDuration(item.totalTime)
        }))
      };
      console.log('[DEBUG] 最终数据集:', finalData);

      this.setData(finalData, () => {
        console.log('[DEBUG] 数据更新完成', {
          groupCount: this.data.groupRankings.length,
          totalCount: this.data.totalRankings.length
        });
      });

    } catch (err) {
      console.error('[ERROR] 数据获取失败:', err);
    }
  },

  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) {
      console.warn('[WARN] 无效的时间参数:', seconds);
      return '--';
    }
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}分${secs}秒`;
  },
});