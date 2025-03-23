Page({
  data: {
    stations: ['起点', '补给站1', '补给站2', '终点'],
    groups: ['A组', 'B组', 'C组', 'D组'],
    selectedStation: null,
    selectedGroup: null,
    scanLoading: false,
    rankings: [],
    showRanking: false
  },

  // 新增小组选择处理
  bindGroupChange(e) {
    this.setData({
      selectedGroup: this.data.groups[e.detail.value]
    })
  },

  async handleScanCode() {
    const { selectedGroup, selectedStation } = this.data;
    
    // 输入验证
    if (!selectedGroup || !selectedStation) {
      return wx.showToast({ 
        title: '请先选择小组和站点', 
        icon: 'none' 
      })
    }

    this.setData({ scanLoading: true });

    try {
      // 1. 扫码操作
      const scanResult = await wx.scanCode({ onlyFromCamera: true });
      const employeeID = scanResult.result;

      // 2. 查询上一站记录
      const prevStation = this.getPrevStation(selectedStation);
      const db = wx.cloud.database();
      const prevRecord = await db.collection('checkpoints')
        .where({
          employeeID,
          groupId: selectedGroup,
          stationName: prevStation
        })
        .get();

      if (!prevRecord.data.length && selectedStation !== '起点') {
        throw new Error('未找到上一站记录');
      }

      // 3. 计算时间差
      const currentTime = new Date();
      const timeDiff = prevRecord.data.length 
        ? currentTime - prevRecord.data[0].timestamp 
        : 0;

      // 4. 写入新记录
      await db.collection('checkpoints').add({
        data: {
          employeeID,
          stationName: selectedStation,
          groupId: selectedGroup,
          timestamp: currentTime,
          timeCost: timeDiff / 1000
        }
      });

      // 5. 更新排名
      await this.calculateRankings();
      
      wx.showToast({ title: '打卡成功' });
    } catch (err) {
      wx.showToast({ 
        title: err.message || '操作失败', 
        icon: 'none' 
      });
    } finally {
      this.setData({ scanLoading: false });
    }
  },

  // 计算当前小组排名
  async calculateRankings() {
    const db = wx.cloud.database();
    const res = await db.collection('checkpoints')
      .where({ groupId: this.data.selectedGroup })
      .get();

    // 按员工ID聚合时间
    const summary = res.data.reduce((acc, cur) => {
      acc[cur.employeeID] = (acc[cur.employeeID] || 0) + cur.timeCost;
      return acc;
    }, {});

    // 生成排名数组
    const rankings = Object.entries(summary)
      .map(([employeeID, totalTime]) => ({ employeeID, totalTime }))
      .sort((a, b) => a.totalTime - b.totalTime);

    this.setData({ 
      rankings,
      showRanking: rankings.length > 0
    });
  },

  // 辅助方法：获取上一站名称
  getPrevStation(currentStation) {
    const index = this.data.stations.indexOf(currentStation);
    return index > 0 ? this.data.stations[index - 1] : null;
  }
});